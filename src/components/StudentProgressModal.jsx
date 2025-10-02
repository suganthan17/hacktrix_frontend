import React, { useEffect, useState } from "react";

/**
 * Props:
 *  - student: object returned from /api/auth/me (e.g. { email, role, name, id })
 *  - courseId: string
 *  - onClose: fn
 */
export default function StudentProgressModal({ student, courseId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  // submission viewer
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState("");
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    if (!student || !courseId) return;
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, courseId]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const studentId = student.id || student._id || student.id;
      const res = await fetch(`/api/progress/${studentId}/${courseId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        // no progress yet
        setProgress(null);
        return;
      }
      const data = await res.json();
      setProgress(data);
    } catch (err) {
      console.error("fetchProgress error:", err);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionForQuiz = async (quizId) => {
    try {
      setActiveSubmission({ loading: true });
      const res = await fetch(`/api/quizzes/${quizId}/submissions`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to fetch submissions");
      }
      const subs = await res.json();
      const sub = (subs || []).find((s) => {
        const sid = s.studentId?._id || s.studentId || s.student;
        return String(sid) === String(student.id || student._id || student.id);
      });
      if (!sub) {
        setActiveSubmission({ loading: false, notFound: true });
        return;
      }
      setActiveSubmission({ loading: false, submission: sub });
      setGradeValue(sub.totalScore ?? "");
    } catch (err) {
      console.error("fetchSubmissionForQuiz error:", err);
      setActiveSubmission(null);
    }
  };

  const doGrade = async () => {
    if (!activeSubmission?.submission) return;
    const id =
      activeSubmission.submission._id || activeSubmission.submission.id;
    if (!id) return alert("Submission id missing");
    const parsed = Number(gradeValue);
    if (Number.isNaN(parsed)) return alert("Enter a valid number");

    try {
      setGrading(true);
      const res = await fetch(`/api/submissions/${id}/grade`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalScore: parsed }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Grading failed");

      // update local progress / submission (backend returns both)
      if (body.progress) setProgress(body.progress);
      if (body.submission)
        setActiveSubmission((s) => ({ ...s, submission: body.submission }));
      alert("Graded successfully");
    } catch (err) {
      console.error("doGrade error:", err);
      alert(err?.message || "Grading failed");
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">
              Progress — {student?.name || student?.email}
            </h3>
            <div className="text-sm text-gray-500">
              Course id: {String(courseId).slice(-8)}
            </div>
          </div>
          <div>
            <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100">
              Close
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div>Loading progress…</div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-4">
                  <div className="w-28">
                    <div className="text-sm text-gray-600">Overall</div>
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
                        <div className="text-sm text-gray-500">
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
                    <div className="text-sm text-gray-500">
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
                        <div className="text-sm text-gray-500">
                          Watched: {v.watchedPercent ?? 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {(progress?.videosWatched || []).length === 0 && (
                    <div className="text-sm text-gray-500">
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
                        <div className="text-sm text-gray-500">
                          Submitted: {p.submitted ? "Yes" : "No"} — Score:{" "}
                          {p.score ?? "-"}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(progress?.projects || []).length === 0 && (
                    <div className="text-sm text-gray-500">
                      No project progress yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Submission viewer & grading */}
              <div>
                {activeSubmission?.loading && <div>Loading submission…</div>}

                {activeSubmission?.notFound && (
                  <div className="p-3 rounded border text-sm text-gray-600">
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
                        {new Date(
                          activeSubmission.submission.submittedAt
                        ).toLocaleString()}
                      </div>
                      <div>
                        <strong>Total score:</strong>{" "}
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
                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="number"
                          value={gradeValue}
                          onChange={(e) => setGradeValue(e.target.value)}
                          placeholder="Total marks"
                          className="px-3 py-2 border rounded w-40"
                        />
                        <button
                          onClick={doGrade}
                          disabled={grading}
                          className="px-3 py-2 rounded bg-green-600 text-white"
                        >
                          {grading ? "Grading…" : "Submit Grade"}
                        </button>
                        <button
                          onClick={() => setActiveSubmission(null)}
                          className="px-3 py-2 rounded bg-gray-200"
                        >
                          Close
                        </button>
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
