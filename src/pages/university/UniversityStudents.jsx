// src/pages/university/UniversityStudents.jsx
import React, { useEffect, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import toast, { Toaster } from "react-hot-toast";
import { ArrowRight, User } from "lucide-react";

const BACKEND_BASE = "http://localhost:5000";

export default function UniversityStudents() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null); // enrollment object
  const [modalOpen, setModalOpen] = useState(false);

  // fetch courses that belong to logged-in university
  const fetchUniversityCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await fetch(`${BACKEND_BASE}/api/courses/university`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load courses");
      }
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length) setSelectedCourse(data[0]);
    } catch (err) {
      console.error("fetchUniversityCourses:", err);
      toast.error(err.message || "Failed to load university courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  // fetch enrollments for selected course
  const fetchEnrollments = async (course) => {
    if (!course) return;
    try {
      setLoadingEnrollments(true);
      const res = await fetch(`${BACKEND_BASE}/api/enrollments/${course._id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load enrollments");
      }
      const data = await res.json();
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchEnrollments:", err);
      toast.error(err.message || "Failed to load enrollments");
      setEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    fetchUniversityCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchEnrollments(selectedCourse);
    else setEnrollments([]);
  }, [selectedCourse]);

  const openStudentModal = (enrollment) => {
    setSelectedStudent(enrollment);
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UniversitySidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster position="top-right" />
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Students & Progress
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Select a course to view enrolled students and track progress.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-400">Courses</div>
              <div className="text-lg font-medium text-slate-700">
                {courses.length}
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center shadow text-white">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="w-72">
                <label className="text-sm text-slate-600 block mb-1">
                  Select Course
                </label>
                <select
                  value={selectedCourse?._id || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const c = courses.find((x) => x._id === id);
                    setSelectedCourse(c || null);
                  }}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Choose course --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ml-auto">
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 rounded bg-indigo-600 text-white"
                  onClick={() => fetchUniversityCourses()}
                >
                  Refresh Courses
                </button>
              </div>
            </div>

            {loadingCourses ? (
              <div className="py-8 text-center text-slate-500">
                Loading courses…
              </div>
            ) : !selectedCourse ? (
              <div className="py-12 text-center text-slate-600">
                No course selected — create a course first or select from the
                list.
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedCourse.name}
                    </h2>
                    <div className="text-sm text-slate-500">
                      {selectedCourse.category || "General"} •{" "}
                      {selectedCourse.lessons ?? "-"} lessons
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    {enrollments.length} enrolled
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-600 border-b">
                      <tr>
                        <th className="py-2">Student</th>
                        <th>Email</th>
                        <th>Enrolled At</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingEnrollments ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-slate-500"
                          >
                            Loading enrollments…
                          </td>
                        </tr>
                      ) : enrollments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-slate-500"
                          >
                            No students enrolled yet.
                          </td>
                        </tr>
                      ) : (
                        enrollments.map((en) => {
                          const student = en.student || en.studentId || {};
                          return (
                            <tr
                              key={en._id || en.enrollmentId}
                              className="border-b"
                            >
                              <td className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-700">
                                    {student.name
                                      ? student.name[0].toUpperCase()
                                      : "S"}
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {student.name || "Unknown"}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {String(student._id || "").slice(-8)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">{student.email || "-"}</td>
                              <td className="py-3">
                                {en.enrolledAt
                                  ? new Date(en.enrolledAt).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="py-3">{en.status || "active"}</td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => openStudentModal(en)}
                                  className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white"
                                >
                                  View Progress
                                  <ArrowRight className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {modalOpen && selectedStudent && (
        <StudentProgressModal
          enrollment={selectedStudent}
          course={selectedCourse}
          onClose={() => {
            setModalOpen(false);
            setSelectedStudent(null);
            // refresh enrollments & progress after grading
            setTimeout(() => fetchEnrollments(selectedCourse), 300);
          }}
        />
      )}
    </div>
  );
}

/* ---------- StudentProgressModal component (embedded) ---------- */

function StudentProgressModal({ enrollment, course, onClose }) {
  const student = enrollment.student || enrollment.studentId || {};
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  const [activeSubmission, setActiveSubmission] = useState(null); // { submission, quizId, loading, notFound }
  const [gradeValue, setGradeValue] = useState("");
  const [grading, setGrading] = useState(false);

  // load Progress doc (uses BACKEND_BASE to avoid SPA fallback)
  const fetchProgress = async () => {
    try {
      setLoading(true);
      const studentId = student._id || student.id || (student && student._id);
      const courseId = course?._id;
      if (!studentId || !courseId) {
        setProgress({
          videosWatched: [],
          quizzes: [],
          projects: [],
          overallCompletion: 0,
        });
        return;
      }

      const url = `${BACKEND_BASE}/api/progress/${studentId}/${courseId}`;
      console.log("[fetchProgress] requesting", url);
      const res = await fetch(url, {
        credentials: "include",
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.log(e)
        console.warn(
          "[fetchProgress] non-json response",
          text?.slice?.(0, 300)
        );
      }

      if (res.status === 404) {
        setProgress({
          videosWatched: [],
          quizzes: [],
          projects: [],
          overallCompletion: 0,
        });
        return;
      }
      if (!res.ok) {
        const msg =
          (data && (data.message || data.error)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setProgress(
        data || {
          videosWatched: [],
          quizzes: [],
          projects: [],
          overallCompletion: 0,
        }
      );
    } catch (err) {
      console.error("fetchProgress Error:", err);
      setProgress({
        videosWatched: [],
        quizzes: [],
        projects: [],
        overallCompletion: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch submissions for a quiz and find this student submission
  const fetchSubmissionForQuiz = async (quizId) => {
    try {
      setActiveSubmission({ loading: true, quizId });
      const url = `${BACKEND_BASE}/api/quizzes/${quizId}/submissions`;
      console.log("[fetchSubmissionForQuiz] requesting", url);
      const res = await fetch(url, { credentials: "include" });

      const text = await res.text();
      let subs = null;
      try {
        subs = text ? JSON.parse(text) : null;
      } catch (e) {
        console.log(e)
        console.warn(
          "[fetchSubmissionForQuiz] non-json response",
          text?.slice?.(0, 300)
        );
      }

      if (!res.ok) {
        const body = subs || {};
        throw new Error(
          body.message || `Failed to fetch submissions (HTTP ${res.status})`
        );
      }

      const arr = Array.isArray(subs) ? subs : [];
      const sid = student._id || student.id || (student && student._id);
      const sub = arr.find((s) => {
        const sidCandidate = s.studentId?._id || s.studentId || s.student;
        return String(sidCandidate) === String(sid);
      });

      if (!sub) {
        setActiveSubmission({ loading: false, quizId, notFound: true });
        return;
      }
      setActiveSubmission({ loading: false, quizId, submission: sub });
      setGradeValue(sub.totalScore ?? "");
    } catch (err) {
      console.error("fetchSubmissionForQuiz", err);
      toast.error(err.message || "Failed to fetch submissions");
      setActiveSubmission(null);
    }
  };

  const doGrade = async () => {
    if (!activeSubmission?.submission) return;
    const id =
      activeSubmission.submission._id || activeSubmission.submission.id;
    if (!id) return toast.error("Submission id missing");
    const parsed = Number(gradeValue);
    if (Number.isNaN(parsed)) return toast.error("Enter a valid numeric score");

    try {
      setGrading(true);
      const url = `${BACKEND_BASE}/api/submissions/${id}/grade`;
      console.log("[doGrade] calling", url, "totalScore=", parsed);

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
      } catch (e) {
        console.log(e)
        console.warn("[doGrade] non-json response", text?.slice?.(0, 300));
      }

      if (!res.ok)
        throw new Error(
          (body && (body.message || body.error)) || `HTTP ${res.status}`
        );

      toast.success("Graded successfully");

      // update UI from returned data if available
      if (body?.progress) setProgress(body.progress);
      if (body?.submission)
        setActiveSubmission((s) => ({ ...s, submission: body.submission }));

      // refresh progress from server to ensure consistency
      await fetchProgress();
    } catch (err) {
      console.error("doGrade", err);
      toast.error(err.message || "Grading failed");
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex items-start justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Progress — {student.name}</h3>
            <div className="text-sm text-slate-500">Course: {course?.name}</div>
          </div>
          <div>
            <button className="px-3 py-1 rounded bg-gray-100" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div>Loading progress…</div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="w-28">
                  <div className="text-sm text-slate-600">Completion</div>
                  <div className="text-2xl font-semibold">
                    {progress?.overallCompletion ?? 0}%
                  </div>
                </div>

                <div className="flex-1">
                  <div className="w-full bg-gray-200 h-3 rounded">
                    <div
                      className="h-3 rounded"
                      style={{
                        width: `${progress?.overallCompletion ?? 0}%`,
                        background: "linear-gradient(90deg,#4ade80,#06b6d4)",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Quizzes</h4>
                <div className="space-y-2">
                  {(progress?.quizzes || []).map((q) => (
                    <div
                      key={String(q.quizId)}
                      className="flex items-center justify-between gap-4 border rounded p-2"
                    >
                      <div>
                        <div className="font-medium">
                          Quiz: {String(q.quizId).slice(-8)}
                        </div>
                        <div className="text-sm text-slate-500">
                          Score: {q.score == null ? "Not graded" : q.score}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 rounded bg-indigo-600 text-white text-sm"
                          onClick={() => fetchSubmissionForQuiz(q.quizId)}
                        >
                          View Submission
                        </button>
                      </div>
                    </div>
                  ))}
                  {(progress?.quizzes || []).length === 0 && (
                    <div className="text-sm text-slate-500">
                      No quizzes recorded yet.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Videos</h4>
                <div className="space-y-2">
                  {(progress?.videosWatched || []).map((v) => (
                    <div
                      key={String(v.videoId)}
                      className="flex items-center justify-between gap-4 border rounded p-2"
                    >
                      <div>
                        <div className="font-medium">
                          Video: {String(v.videoId).slice(-8)}
                        </div>
                        <div className="text-sm text-slate-500">
                          Watched: {v.watchedPercent ?? 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {(progress?.videosWatched || []).length === 0 && (
                    <div className="text-sm text-slate-500">
                      No video progress yet.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Projects</h4>
                <div className="space-y-2">
                  {(progress?.projects || []).map((p) => (
                    <div
                      key={String(p.projectId)}
                      className="flex items-center justify-between gap-4 border rounded p-2"
                    >
                      <div>
                        <div className="font-medium">
                          Project: {String(p.projectId).slice(-8)}
                        </div>
                        <div className="text-sm text-slate-500">
                          Submitted: {p.submitted ? "Yes" : "No"} — Score:{" "}
                          {p.score ?? "-"}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(progress?.projects || []).length === 0 && (
                    <div className="text-sm text-slate-500">
                      No project progress yet.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">
                  Submission Viewer & Grading
                </h4>

                {activeSubmission?.loading && <div>Loading submission…</div>}

                {activeSubmission?.notFound && (
                  <div className="p-3 rounded border text-sm text-slate-600">
                    No submission found for this student & quiz.
                  </div>
                )}

                {activeSubmission?.submission && (
                  <div className="border rounded p-3 space-y-3 bg-gray-50">
                    <div className="text-sm">
                      <div>
                        <strong>Submission id:</strong>{" "}
                        {String(activeSubmission.submission._id).slice(-8)}
                      </div>
                      <div>
                        <strong>Submitted at:</strong>{" "}
                        {activeSubmission.submission.submittedAt
                          ? new Date(
                              activeSubmission.submission.submittedAt
                            ).toLocaleString()
                          : "-"}
                      </div>
                      <div>
                        <strong>Total score (stored):</strong>{" "}
                        {activeSubmission.submission.totalScore ?? 0}
                      </div>
                      <div>
                        <strong>Graded:</strong>{" "}
                        {activeSubmission.submission.graded ? "Yes" : "No"}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-sm mb-1">Answers</div>
                      <div className="space-y-2">
                        {(activeSubmission.submission.answers || []).map(
                          (a, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white border rounded text-sm"
                            >
                              <div>
                                <strong>Q:</strong>{" "}
                                {String(a.questionId).slice(-8)}
                              </div>
                              <div>
                                <strong>Answer:</strong> {a.answerText}
                              </div>
                              <div>
                                <strong>Correct:</strong>{" "}
                                {a.isCorrect ? "Yes" : "No"}
                              </div>
                              <div>
                                <strong>MarksObtained:</strong>{" "}
                                {a.marksObtained ?? "-"}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {!activeSubmission.submission.graded && (
                      <div className="pt-2">
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={gradeValue}
                            onChange={(e) => setGradeValue(e.target.value)}
                            placeholder="Enter total marks"
                            className="px-3 py-2 border rounded w-40"
                          />
                          <button
                            className="px-3 py-2 rounded bg-green-600 text-white"
                            onClick={doGrade}
                            disabled={grading}
                          >
                            {grading ? "Grading…" : "Submit Grade"}
                          </button>
                          <button
                            className="px-3 py-2 rounded bg-gray-200"
                            onClick={() => setActiveSubmission(null)}
                          >
                            Close
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          This calls PUT /api/submissions/:id/grade
                        </div>
                      </div>
                    )}

                    {activeSubmission.submission.graded && (
                      <div className="text-sm text-green-600">
                        Already graded
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
