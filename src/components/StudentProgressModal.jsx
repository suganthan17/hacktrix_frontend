// src/components/StudentProgressModal.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { X, Eye, Download, Users, FileText } from "lucide-react";

const BACKEND_BASE = "http://localhost:5000"; // adjust if your backend uses a different origin

/* -------------------- utilities -------------------- */
function normalizeProfile(raw = {}) {
  const r = raw?.profile || raw || {};
  return {
    name: r.name || r.fullName || r.displayName || "",
    email: r.email || r.username || "",
    phone: r.phone || r.contactNumber || "",
    location: r.location || r.city || "",
    school: r.school || "",
    grade: r.grade || r.year || "",
    profilePic: r.profilePic || r.avatar || null,
    resume: r.resume || r.cv || null,
    updatedAt: r.updatedAt || r.updated_at || r.updated || null,
    _id: r._id || r.id || null,
  };
}

function safeParseJson(txt) {
  try {
    return txt ? JSON.parse(txt) : null;
  } catch {
    return null;
  }
}

function withTimeoutFetch(url, opts = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const final = { ...opts, signal: controller.signal };
  const p = fetch(url, final).finally(() => clearTimeout(id));
  return { promise: p, controller };
}

/* small sparkline component (keeps UI) */
function Sparkline({ values = [], width = 150, height = 36 }) {
  if (!values || values.length === 0)
    return (
      <svg width={width} height={height} className="opacity-30">
        <rect width={width} height={height} rx="6" ry="6" fill="transparent" />
      </svg>
    );
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const step = width / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(" ");
  const last = values[values.length - 1];
  return (
    <svg width={width} height={height} className="select-none">
      <polyline fill="none" stroke="url(#g)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle cx={(values.length - 1) * step} cy={height - ((last - min) / range) * height} r="3.4" fill="#06b6d4" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

/* -------------------- component -------------------- */
export default function StudentProgressModal({
  student: propStudent,
  studentId: propStudentId,
  studentProfile: propStudentProfile,
  enrollment,
  course,
  courseId: propCourseId,
  onClose,
}) {
  const derivedStudent = propStudent || (enrollment && (enrollment.student || enrollment.studentId)) || null;
  const studentId = propStudentId || derivedStudent?.id || derivedStudent?._id || derivedStudent?.studentId || null;
  const courseId = propCourseId || (course && (course._id || course.id)) || (enrollment && enrollment.courseId) || null;
  const baseUrl = useMemo(() => BACKEND_BASE.replace(/\/$/, ""), []);

  const [progress, setProgress] = useState({ quizzes: [], projects: [] });
  const [studentProfile, setStudentProfile] = useState(
    propStudentProfile ? normalizeProfile(propStudentProfile) : derivedStudent ? normalizeProfile(derivedStudent) : null
  );
  const [quizTitleMap, setQuizTitleMap] = useState({});
  const [tab, setTab] = useState("overview");
  const mountedRef = useRef(true);

  // controllers for aborting in-flight fetches
  const controllersRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllersRef.current.forEach((c) => {
        try {
          c.abort();
        } catch {}
      });
      controllersRef.current = [];
    };
  }, []);

  const clearControllers = () => {
    controllersRef.current.forEach((c) => {
      try {
        c.abort();
      } catch {}
    });
    controllersRef.current = [];
  };

  /* --------- fetch helpers --------- */
  const fetchStudentProfile = useCallback(
    async (sid) => {
      if (!sid) return null;
      clearControllers();
      const attempts = [
        `${baseUrl}/api/student-profile/${encodeURIComponent(sid)}`,
        `${baseUrl}/api/students/${encodeURIComponent(sid)}`,
      ];
      for (const url of attempts) {
        try {
          const { promise, controller } = withTimeoutFetch(url, { credentials: "include" }, 12000);
          controllersRef.current.push(controller);
          const res = await promise;
          controllersRef.current = controllersRef.current.filter((c) => c !== controller);
          if (!res.ok) continue;
          const txt = await res.text().catch(() => "");
          const data = safeParseJson(txt);
          const candidate = (data && (data.profile || data)) || null;
          if (candidate) return normalizeProfile(candidate);
        } catch (err) {
          if (err?.name === "AbortError") return null;
          console.warn("fetchStudentProfile error", err);
        }
      }
      return null;
    },
    [baseUrl]
  );

  useEffect(() => {
    if (propStudentProfile) return;
    if (!studentId) return;
    let alive = true;
    (async () => {
      const p = await fetchStudentProfile(studentId);
      if (alive && p && mountedRef.current) setStudentProfile((prev) => ({ ...(prev || {}), ...p }));
    })();
    return () => {
      alive = false;
    };
  }, [studentId, propStudentProfile, fetchStudentProfile]);

  useEffect(() => {
    if (!courseId) {
      setQuizTitleMap({});
      return;
    }
    clearControllers();
    let alive = true;
    (async () => {
      try {
        const url = `${baseUrl}/api/quizzes/course/${encodeURIComponent(courseId)}`;
        const { promise, controller } = withTimeoutFetch(url, { credentials: "include" }, 12000);
        controllersRef.current.push(controller);
        const r = await promise;
        controllersRef.current = controllersRef.current.filter((c) => c !== controller);
        if (!alive || !mountedRef.current) return;
        if (!r.ok) {
          setQuizTitleMap({});
          return;
        }
        const body = await r.json().catch(() => null);
        const map = {};
        if (Array.isArray(body)) {
          for (const q of body) {
            const id = q?._id || q?.id;
            if (!id) continue;
            map[String(id)] = q.title || q.name || `Quiz ${String(id).slice(-6)}`;
          }
        }
        setQuizTitleMap(map);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.warn("fetch quizzes error", err);
        setQuizTitleMap({});
      }
    })();
    return () => {
      alive = false;
    };
  }, [courseId, baseUrl]);

  const fetchProgress = useCallback(async () => {
    if (!studentId || !courseId) return;
    clearControllers();
    try {
      const url = `${baseUrl}/api/progress/${encodeURIComponent(studentId)}/${encodeURIComponent(courseId)}`;
      const { promise, controller } = withTimeoutFetch(url, { credentials: "include" }, 12000);
      controllersRef.current.push(controller);
      const r = await promise;
      controllersRef.current = controllersRef.current.filter((c) => c !== controller);
      if (!mountedRef.current) return;
      if (r.status === 404) {
        setProgress({ quizzes: [], projects: [] });
        return;
      }
      if (!r.ok) {
        toast.error("Failed to load progress");
        setProgress({ quizzes: [], projects: [] });
        return;
      }
      const text = await r.text().catch(() => "");
      const body = safeParseJson(text);
      const normalized = {
        quizzes: Array.isArray(body?.quizzes)
          ? body.quizzes.map((q) => {
              const qid = q?.quizId?._id ?? q?.quizId ?? q?.quiz;
              return { quizId: qid ? String(qid) : "", score: q?.score ?? null };
            })
          : [],
        projects: Array.isArray(body?.projects) ? body.projects : [],
      };
      setProgress(normalized);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("fetchProgress error:", err);
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

  const computeTotalsFromQuizzes = (quizzes) => {
    // compute average and count for display in overview
    if (!Array.isArray(quizzes) || quizzes.length === 0) return { count: 0, avg: null };
    const valid = quizzes.filter((q) => q.score !== null && q.score !== undefined && !Number.isNaN(Number(q.score)));
    if (valid.length === 0) return { count: quizzes.length, avg: null };
    const sum = valid.reduce((s, q) => s + Number(q.score), 0);
    return { count: quizzes.length, avg: sum / valid.length };
  };

  const avatarLetter = useMemo(() => {
    const s = studentProfile?.name || studentProfile?.email || "S";
    return String(s)[0]?.toUpperCase() || "S";
  }, [studentProfile]);

  const quizScores = useMemo(
    () =>
      progress.quizzes
        .map((q) => (q.score !== null && q.score !== undefined && !Number.isNaN(Number(q.score)) ? Number(q.score) : 0))
        .slice(0, 12),
    [progress.quizzes]
  );

  const totals = useMemo(() => computeTotalsFromQuizzes(progress.quizzes), [progress.quizzes]);

  const maybeAbsolute = (path) => {
    if (!path) return null;
    const s = String(path);
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `${baseUrl}${s.startsWith("/") ? "" : "/"}${s}`;
  };

  /* -------------------- render (overview-only includes quiz list) -------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
              {avatarLetter}
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight">{studentProfile?.name || "Unknown student"}</div>
              <div className="text-sm text-slate-500">{studentProfile?.email || "—"}</div>
              <div className="text-xs text-slate-400 mt-1">
                <span className="font-medium text-slate-700">{course?.name || courseId || "Unknown course"}</span> • {studentProfile?.grade || "—"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-slate-50 transition">
            <X className="h-4 w-4 text-slate-600" />
            <span className="text-sm text-slate-700">Close</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            <div className="rounded-2xl p-4 bg-white shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 font-medium">Overview</div>
                <div className="text-xs text-slate-400">
                  Updated: {studentProfile?.updatedAt ? new Date(studentProfile.updatedAt).toLocaleDateString() : "—"}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white border flex flex-col">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" /> Quizzes
                  </div>
                  <div className="mt-2 text-lg font-bold">{progress.quizzes?.length ?? 0}</div>
                  <div className="mt-2 text-xs text-slate-500">Recorded attempts</div>
                </div>

                <div className="p-3 rounded-lg bg-white border flex flex-col">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" /> Projects
                  </div>
                  <div className="mt-2 text-lg font-bold">{progress.projects?.length ?? 0}</div>
                  <div className="mt-2 text-xs text-slate-500">Submitted / assigned</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-slate-500">Recent scores</div>
                <div className="mt-2">
                  <Sparkline values={quizScores} />
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {totals.avg !== null ? <>Average score: <strong>{(totals.avg).toFixed(2)}</strong></> : <>No numeric scores yet.</>}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">Profile</div>
                <a href={maybeAbsolute(studentProfile?.resume)} target="_blank" rel="noreferrer" className="text-xs inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                  <Download className="h-4 w-4" /> Resume
                </a>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                <div><strong>School:</strong> {studentProfile?.school || "—"}</div>
                <div className="mt-1"><strong>Location:</strong> {studentProfile?.location || "—"}</div>
                <div className="mt-1"><strong>Phone:</strong> {studentProfile?.phone || "—"}</div>
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="rounded-2xl bg-white border shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-2 rounded-xl cursor-pointer ${tab === "overview" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-700"}`} onClick={() => setTab("overview")}>Overview</div>
                  {/* keep Submissions tab label but it will just show quiz list if clicked */ }
                  <div className={`px-3 py-2 rounded-xl cursor-pointer ${tab === "submissions" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-700"}`} onClick={() => setTab("submissions")}>Quizzes</div>
                </div>
                <div className="text-xs text-slate-500">Course ID: <span className="text-slate-700 font-medium">{courseId ?? "—"}</span></div>
              </div>

              <div className="mt-4">
                {tab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-500">Latest quiz</div>
                          <div className="text-sm font-semibold mt-1">
                            {progress.quizzes && progress.quizzes.length > 0
                              ? (quizTitleMap[String(progress.quizzes[0].quizId)] || `Quiz ${String(progress.quizzes[0].quizId).slice(-6)}`)
                              : "No quiz"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Status</div>
                          <div className={`mt-1 text-sm font-semibold ${progress.quizzes && progress.quizzes.length > 0 && progress.quizzes[0].score !== null && progress.quizzes[0].score !== undefined ? "text-emerald-600" : "text-yellow-700"}`}>
                            {progress.quizzes && progress.quizzes.length > 0 && progress.quizzes[0].score !== null && progress.quizzes[0].score !== undefined ? "Completed" : "Not completed"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        Latest score: <strong>{progress.quizzes && progress.quizzes.length > 0 ? (progress.quizzes[0].score ?? "-") : "-"}</strong>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="text-xs text-slate-500">Projects</div>
                      <div className="mt-2 text-sm font-semibold">{progress.projects?.length ?? 0} recorded</div>
                      <div className="mt-3 text-xs text-slate-500">Open project list on course page to view details.</div>
                    </div>

                    <div className="rounded-lg border p-4 md:col-span-2">
                      <div className="text-xs text-slate-500">Notes</div>
                      <div className="mt-2 text-sm text-slate-600">Quiz marks are shown inline in this overview. For per-question detail the backend must expose submission endpoints — this UI no longer requests them.</div>
                    </div>
                  </div>
                )}

                {(tab === "submissions") && (
                  <div>
                    <div className="mb-3 text-sm text-slate-600">Quizzes & marks recorded for this student in the course:</div>

                    <div className="space-y-3">
                      {progress.quizzes && progress.quizzes.length > 0 ? (
                        progress.quizzes.map((q) => {
                          const id = String(q.quizId || "");
                          const title = quizTitleMap[id] || `Quiz ${id.slice(-6)}`;
                          return (
                            <div key={id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                              <div>
                                <div className="text-sm font-medium">{title}</div>
                                <div className="text-xs text-slate-400 mt-1">ID: {id.slice(-8)}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-semibold">{q.score ?? "-"}</div>
                                <button onClick={() => { /* keep as visual only — no submission fetch */ }} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition">
                                  <Eye className="h-4 w-4" /> View
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-lg border p-4 bg-slate-50 text-sm text-slate-500">No quiz submissions recorded.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">Student ID: <span className="text-slate-700">{studentId ?? "—"}</span></div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setTab("overview"); fetchProgress(); }} className="px-3 py-2 rounded-xl border hover:bg-slate-50">Refresh</button>
                <button onClick={() => onClose && onClose()} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Done</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
