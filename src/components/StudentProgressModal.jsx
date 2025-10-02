// src/components/StudentProgressModal.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import toast from "react-hot-toast";
import {
  X,
  Eye,
  Download,
  CheckCircle,
  Clock,
  Users,
  FileText,
} from "lucide-react";

const BACKEND_BASE = "http://localhost:5000";

/** safe fetch for when server sometimes returns non-json */
async function safeFetchJsonRaw(url, options = {}) {
  try {
    const res = await fetch(url, { credentials: "include", ...options });
    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    console.error("safeFetchJsonRaw network error:", err);
    return { ok: false, status: 0, text: "" };
  }
}

/** Normalize a profile-like payload into our UI shape */
function normalizeProfile(raw = {}) {
  const r = raw.profile || raw || {};
  return {
    name: r.name || r.fullName || "",
    email: r.email || r.username || "",
    phone: r.phone || r.contactNumber || "",
    location: r.location || r.city || "",
    school: r.school || "",
    grade: r.grade || r.year || "",
    profilePic: r.profilePic || r.avatar || null,
    resume: r.resume || r.cv || null,
    updatedAt: r.updatedAt || r.updated_at || null,
    _id: r._id || r.id || null,
  };
}

/** Inline sparkline (small, dependency-free) */
function Sparkline({ values = [], width = 150, height = 36 }) {
  if (!values || values.length === 0) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <rect width={width} height={height} rx="6" ry="6" fill="transparent" />
      </svg>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const step = width / Math.max(1, values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const last = values[values.length - 1];

  return (
    <svg width={width} height={height} className="select-none">
      <polyline
        fill="none"
        stroke="url(#g)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle
        cx={(values.length - 1) * step}
        cy={height - ((last - min) / range) * height}
        r="3.4"
        fill="#06b6d4"
        stroke="#fff"
        strokeWidth="1"
      />
    </svg>
  );
}

export default function StudentProgressModal({
  student: propStudent,
  studentId: propStudentId,
  enrollment,
  course,
  courseId: propCourseId,
  onClose,
}) {
  const derivedStudent =
    propStudent ||
    (enrollment && (enrollment.student || enrollment.studentId)) ||
    null;

  const studentId =
    propStudentId ||
    derivedStudent?.id ||
    derivedStudent?._id ||
    derivedStudent?.studentId ||
    null;

  const courseId =
    propCourseId ||
    (course && (course._id || course.id)) ||
    (enrollment && enrollment.courseId) ||
    null;

  const baseUrl = useMemo(() => BACKEND_BASE.replace(/\/$/, ""), []);

  const [progress, setProgress] = useState({
    quizzes: [],
    projects: [],
  });
  const [studentProfile, setStudentProfile] = useState(
    derivedStudent ? normalizeProfile(derivedStudent) : null
  );
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState("");
  const [grading, setGrading] = useState(false);
  const [quizTitleMap, setQuizTitleMap] = useState({});
  const [tab, setTab] = useState("overview");

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // fetch student profile
  const fetchStudentProfile = useCallback(
    async (sid) => {
      if (!sid) return null;
      const endpoints = [
        `${baseUrl}/api/student-profile/${encodeURIComponent(sid)}`,
        `${baseUrl}/api/students/${encodeURIComponent(sid)}`,
        `${baseUrl}/api/users/${encodeURIComponent(sid)}`,
      ];
      for (const url of endpoints) {
        const res = await safeFetchJsonRaw(url, { method: "GET" });
        if (!res.ok) continue;
        try {
          const parsed = res.text ? JSON.parse(res.text) : null;
          return normalizeProfile(parsed);
        } catch {
          return normalizeProfile({ profile: res.text || {} });
        }
      }
      return null;
    },
    [baseUrl]
  );

  useEffect(() => {
    if (!studentId) return;
    let alive = true;
    (async () => {
      try {
        const prof = await fetchStudentProfile(studentId);
        if (alive && prof)
          setStudentProfile((p) => ({ ...(p || {}), ...prof }));
      } catch {
        console.log("err");
      }
    })();
    return () => {
      alive = false;
    };
  }, [studentId, fetchStudentProfile]);

  // quiz title map
  useEffect(() => {
    if (!courseId) {
      setQuizTitleMap({});
      return;
    }
    let alive = true;
    (async () => {
      try {
        const url = `${baseUrl}/api/quizzes/course/${encodeURIComponent(
          courseId
        )}`;
        const r = await fetch(url, { credentials: "include" });
        if (!r.ok) return;
        const body = await r.json().catch(() => null);
        if (!alive) return;
        const map = {};
        if (Array.isArray(body)) {
          for (const q of body) {
            const id = q?._id || q?.id;
            if (!id) continue;
            map[String(id)] =
              q.title || q.name || `Quiz ${String(id).slice(-6)}`;
          }
        }
        setQuizTitleMap(map);
      } catch (err) {
        console.error("fetch course quizzes error:", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, [courseId, baseUrl]);

  // fetch progress
  const fetchProgress = useCallback(async () => {
    if (!studentId || !courseId) return;
    try {
      const url = `${baseUrl}/api/progress/${encodeURIComponent(
        studentId
      )}/${encodeURIComponent(courseId)}`;
      const { ok, status, text } = await safeFetchJsonRaw(url, {
        method: "GET",
      });

      if (status === 404) {
        setProgress({ quizzes: [], projects: [] });
        return;
      }
      if (!ok) {
        toast.error("Failed to load progress");
        setProgress({ quizzes: [], projects: [] });
        return;
      }

      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        console.log("err");
      }

      const normalized = {
        quizzes: Array.isArray(data?.quizzes)
          ? data.quizzes.map((q) => {
              const qid = q?.quizId?._id ?? q?.quizId ?? q?.quiz;
              return {
                quizId: qid ? String(qid) : "",
                score: q?.score ?? null,
              };
            })
          : [],
        projects: Array.isArray(data?.projects) ? data.projects : [],
      };

      if (mountedRef.current) setProgress(normalized);
    } catch {
      toast.error("Error fetching progress");
      if (mountedRef.current) setProgress({ quizzes: [], projects: [] });
    }
  }, [studentId, courseId, baseUrl]);

  useEffect(() => {
    if (!studentId || !courseId) return;
    fetchProgress();
    const handler = () => fetchProgress();
    window.addEventListener("quizSubmitted", handler);
    return () => window.removeEventListener("quizSubmitted", handler);
  }, [studentId, courseId, fetchProgress]);

  // fetch submission
  const fetchSubmissionForQuiz = useCallback(
    async (quizId) => {
      if (!quizId) return;
      try {
        setActiveSubmission({ loading: true });
        const url = `${baseUrl}/api/quizzes/${encodeURIComponent(
          quizId
        )}/submissions`;
        const { ok, text } = await safeFetchJsonRaw(url, { method: "GET" });
        if (!ok) {
          toast.error("Failed to load submissions");
          setActiveSubmission(null);
          return;
        }
        let subs = [];
        try {
          subs = text ? JSON.parse(text) : [];
        } catch {
          console.log("err");
        }
        const sid = String(studentId);
        const sub = Array.isArray(subs)
          ? subs.find((s) => {
              const sidCandidate =
                s?.studentId?._id ?? s?.studentId ?? s?.student;
              return String(sidCandidate) === sid;
            })
          : null;
        if (!sub) {
          setActiveSubmission({ loading: false, notFound: true });
          return;
        }
        const normalizedSubmission = {
          ...sub,
          totalScore: sub.totalScore ?? sub.totalMarks ?? null,
          graded: !!sub.graded,
          submittedAt: sub.submittedAt
            ? new Date(sub.submittedAt).toISOString()
            : null,
          answers: Array.isArray(sub.answers) ? sub.answers : [],
        };
        setActiveSubmission({
          loading: false,
          submission: normalizedSubmission,
        });
        setGradeValue(normalizedSubmission.totalScore ?? "");
        setTab("submissions");
      } catch {
        toast.error("Failed to fetch submission");
        setActiveSubmission(null);
      }
    },
    [studentId, baseUrl]
  );

  // grade submission
  const doGrade = useCallback(async () => {
    if (!activeSubmission?.submission)
      return toast.error("No submission selected");
    const id =
      activeSubmission.submission._id || activeSubmission.submission.id;
    if (!id) return toast.error("Submission id missing");
    const parsed = Number(gradeValue);
    if (Number.isNaN(parsed)) return toast.error("Enter a valid numeric score");

    try {
      setGrading(true);
      const url = `${baseUrl}/api/submissions/${encodeURIComponent(id)}/grade`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ totalScore: parsed }),
      });
      const text = await res.text();
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        console.log("err");
      }
      if (!res.ok) {
        throw new Error(
          (body && (body.message || body.error)) || `HTTP ${res.status}`
        );
      }
      toast.success("Graded successfully");
      if (body?.submission)
        setActiveSubmission((s) => ({ ...s, submission: body.submission }));
      if (body?.progress) {
        const p = body.progress;
        setProgress({
          quizzes: Array.isArray(p?.quizzes)
            ? p.quizzes.map((q) => {
                const qid = q?.quizId?._id ?? q?.quizId ?? q?.quiz;
                return {
                  quizId: qid ? String(qid) : "",
                  score: q?.score ?? null,
                };
              })
            : [],
          projects: Array.isArray(p?.projects) ? p.projects : [],
        });
      }
      await fetchProgress();
    } catch (err) {
      toast.error(err?.message || "Grading failed");
    } finally {
      setGrading(false);
    }
  }, [activeSubmission, gradeValue, fetchProgress, baseUrl]);

  const avatarLetter = useMemo(() => {
    const s = studentProfile?.name || studentProfile?.email || "S";
    return String(s)[0]?.toUpperCase() || "S";
  }, [studentProfile]);

  const quizScores = useMemo(
    () =>
      progress.quizzes
        .map((q) =>
          q.score !== null && q.score !== undefined ? Number(q.score) : 0
        )
        .slice(0, 12),
    [progress.quizzes]
  );

  const singleQuiz = progress?.quizzes?.[0] || null;
  const quizCompleted =
    !!singleQuiz && singleQuiz.score !== null && singleQuiz.score !== undefined;

  const maybeAbsolute = (path) => {
    if (!path) return null;
    const s = String(path);
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `${baseUrl}${s.startsWith("/") ? "" : "/"}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
              {avatarLetter}
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight">
                {studentProfile?.name || "Unknown student"}
              </div>
              <div className="text-sm text-slate-500">
                {studentProfile?.email || "—"}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                <span className="font-medium text-slate-700">
                  {course?.name || courseId || "Unknown course"}
                </span>{" "}
                • {studentProfile?.grade || "—"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-slate-50 transition"
          >
            <X className="h-4 w-4 text-slate-600" />
            <span className="text-sm text-slate-700">Close</span>
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="col-span-1 space-y-4">
            <div className="rounded-2xl p-4 bg-white shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 font-medium">
                  Overview
                </div>
                <div className="text-xs text-slate-400">
                  Updated:{" "}
                  {studentProfile?.updatedAt
                    ? new Date(studentProfile.updatedAt).toLocaleDateString()
                    : "—"}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white border flex flex-col">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" /> Quizzes
                  </div>
                  <div className="mt-2 text-lg font-bold">
                    {progress.quizzes?.length ?? 0}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Recorded attempts
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border flex flex-col">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" /> Projects
                  </div>
                  <div className="mt-2 text-lg font-bold">
                    {progress.projects?.length ?? 0}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Submitted / assigned
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-slate-500">Recent scores</div>
                <div className="mt-2">
                  <Sparkline values={quizScores} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">
                  Profile
                </div>
                <a
                  href={maybeAbsolute(studentProfile?.resume)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                >
                  <Download className="h-4 w-4" /> Resume
                </a>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                <div>
                  <strong>School:</strong> {studentProfile?.school || "—"}
                </div>
                <div className="mt-1">
                  <strong>Location:</strong> {studentProfile?.location || "—"}
                </div>
                <div className="mt-1">
                  <strong>Phone:</strong> {studentProfile?.phone || "—"}
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setTab("submissions")}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  <Eye className="h-4 w-4" /> View Submissions
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-span-2 space-y-4">
            <div className="rounded-2xl bg-white border shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`px-3 py-2 rounded-xl cursor-pointer ${
                      tab === "overview"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-50 text-slate-700"
                    }`}
                    onClick={() => setTab("overview")}
                  >
                    Overview
                  </div>
                  <div
                    className={`px-3 py-2 rounded-xl cursor-pointer ${
                      tab === "submissions"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-50 text-slate-700"
                    }`}
                    onClick={() => setTab("submissions")}
                  >
                    Submissions
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Course ID:{" "}
                  <span className="text-slate-700 font-medium">
                    {courseId ?? "—"}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                {tab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-500">
                            Latest quiz
                          </div>
                          <div className="text-sm font-semibold mt-1">
                            {singleQuiz
                              ? quizTitleMap[String(singleQuiz.quizId)] ||
                                `Quiz ${String(singleQuiz.quizId).slice(-6)}`
                              : "No quiz"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Status</div>
                          <div
                            className={`mt-1 text-sm font-semibold ${
                              quizCompleted
                                ? "text-emerald-600"
                                : "text-yellow-700"
                            }`}
                          >
                            {quizCompleted ? "Completed" : "Not completed"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="text-xs text-slate-500">Projects</div>
                      <div className="mt-2 text-sm font-semibold">
                        {progress.projects?.length ?? 0} recorded
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        Open project list on course page to view details.
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 md:col-span-2">
                      <div className="text-xs text-slate-500">Notes</div>
                      <div className="mt-2 text-sm text-slate-600">
                        Use <strong>View Submission</strong> to inspect answer
                        details and grade. Grades update course progress
                        automatically.
                      </div>
                    </div>
                  </div>
                )}

                {tab === "submissions" && (
                  <div>
                    <div className="mb-3 text-sm text-slate-600">
                      Actions: click a quiz to load its submission.
                    </div>

                    {/* List of quizzes */}
                    <div className="space-y-3">
                      {progress.quizzes && progress.quizzes.length > 0 ? (
                        progress.quizzes.map((q) => {
                          const id = String(q.quizId || "");
                          const title =
                            quizTitleMap[id] || `Quiz ${id.slice(-6)}`;
                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-white"
                            >
                              <div>
                                <div className="text-sm font-medium">
                                  {title}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  ID: {id.slice(-8)}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-sm font-semibold">
                                  {q.score ?? "-"}
                                </div>
                                <button
                                  onClick={() => fetchSubmissionForQuiz(id)}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                                >
                                  <Eye className="h-4 w-4" /> View
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-lg border p-4 bg-slate-50 text-sm text-slate-500">
                          No quiz submissions recorded.
                        </div>
                      )}
                    </div>

                    {/* Submission detail */}
                    <div className="mt-4">
                      {activeSubmission?.loading && (
                        <div className="rounded-lg border p-4 bg-slate-50 text-sm text-slate-500">
                          Loading submission…
                        </div>
                      )}

                      {activeSubmission?.notFound && (
                        <div className="rounded-lg border p-4 bg-slate-50 text-sm text-slate-600">
                          No submission found for this student & quiz.
                        </div>
                      )}

                      {activeSubmission?.submission && (
                        <div className="rounded-lg border p-4 bg-white">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-semibold">
                                Submission •{" "}
                                {String(
                                  activeSubmission.submission._id || ""
                                ).slice(-8)}
                              </div>
                              <div className="text-xs text-slate-400">
                                {activeSubmission.submission.submittedAt
                                  ? new Date(
                                      activeSubmission.submission.submittedAt
                                    ).toLocaleString()
                                  : "-"}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-slate-400">
                                Total
                              </div>
                              <div className="text-lg font-bold">
                                {activeSubmission.submission.totalScore ?? "-"}
                              </div>
                              <div className="text-xs mt-1">
                                {activeSubmission.submission.graded ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600">
                                    <CheckCircle className="h-4 w-4" /> Graded
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-yellow-700">
                                    <Clock className="h-4 w-4" /> Not graded
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium mb-2">
                                Answers
                              </div>
                              <div className="max-h-56 overflow-auto space-y-2 pr-2">
                                {(activeSubmission.submission.answers || [])
                                  .length > 0 ? (
                                  activeSubmission.submission.answers.map(
                                    (a, idx) => (
                                      <div
                                        key={idx}
                                        className="p-3 rounded-lg border bg-slate-50"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="text-sm">
                                            <strong>Q:</strong>{" "}
                                            {String(a.questionId).slice(-8)}
                                          </div>
                                          <div className="text-xs">
                                            {a.isCorrect ? (
                                              <span className="text-emerald-600">
                                                Correct
                                              </span>
                                            ) : (
                                              <span className="text-red-600">
                                                Wrong
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="mt-2 text-sm">
                                          <strong>Answer:</strong>{" "}
                                          {a.answerText}
                                        </div>
                                        <div className="mt-2 text-xs text-slate-500">
                                          Marks: {a.marksObtained ?? "-"}
                                        </div>
                                      </div>
                                    )
                                  )
                                ) : (
                                  <div className="text-sm text-slate-500">
                                    No answers recorded.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="text-sm font-medium mb-2">
                                Grade
                              </div>
                              {!activeSubmission.submission.graded ? (
                                <div className="space-y-3">
                                  <input
                                    type="number"
                                    value={gradeValue}
                                    onChange={(e) =>
                                      setGradeValue(e.target.value)
                                    }
                                    placeholder="Total marks"
                                    className="w-full px-3 py-2 border rounded-xl"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={doGrade}
                                      disabled={grading}
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
                                    >
                                      {grading ? "Grading…" : "Submit Grade"}
                                    </button>
                                    <button
                                      onClick={() => setActiveSubmission(null)}
                                      className="px-4 py-2 rounded-xl border hover:bg-slate-50"
                                    >
                                      Close
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-emerald-600">
                                  Already graded
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* small footer actions */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Student ID:{" "}
                <span className="text-slate-700">{studentId ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTab("overview");
                    fetchProgress();
                  }}
                  className="px-3 py-2 rounded-xl border hover:bg-slate-50"
                >
                  Refresh
                </button>
                <button
                  onClick={() => onClose && onClose()}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
