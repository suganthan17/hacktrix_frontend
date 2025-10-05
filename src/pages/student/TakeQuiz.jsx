// src/pages/TakeQuiz.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";

const BASE_URL = "http://localhost:5000";

async function safeFetchJson(url, options = {}) {
  const fetchOptions = {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  const res = await fetch(url, fetchOptions);
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  console.log(`[safeFetchJson] ${url} -> status ${res.status} content-type: ${contentType}`);
  if (raw && raw.length > 0) console.debug("[safeFetchJson] raw (first 1000):", raw.slice(0, 1000));

  if (!res.ok) {
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { console.log(e) }
    const err = new Error(parsed?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.raw = raw;
    throw err;
  }

  if (!contentType.includes("application/json")) {
    const err = new Error("Invalid server response: expected JSON");
    err.status = res.status;
    err.raw = raw;
    throw err;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    e.raw = raw;
    console.error("[safeFetchJson] JSON parse failed:", e);
    throw e;
  }
}

export default function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [marks, setMarks] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);

  useEffect(() => {
    console.log(questions)
  },[questions])

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await safeFetchJson(`${BASE_URL}/api/quizzes/${quizId}`, { method: "GET" });
        const qArr = Array.isArray(data) ? data : data.questions ?? [];
        setQuestions(qArr);
        setAnswers({});

        // check if current student already submitted
        try {
          const sub = await safeFetchJson(`${BASE_URL}/api/quizzes/${quizId}/submission`, { method: "GET" });
          setExistingSubmission(sub);
          if (sub?.totalScore !== undefined) setMarks(sub.totalScore);
        } catch (subErr) {
          if (subErr.status === 404) {
            setExistingSubmission(null);
          } else {
            console.warn("check existing submission failed:", subErr);
          }
        }
      } catch (err) {
        console.error("load quiz error:", err);
        if (err.raw) console.log("Server raw response (first 1000 chars):", err.raw.slice(0, 1000));
        toast.error(err.message || "Failed to load quiz");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId, navigate]);

  const onSelect = (questionId, optionText) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionText }));
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQuestions = questions.length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    if (existingSubmission) {
      toast.error("You already submitted this quiz.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q._id,
        answerText: answers[q._id],
      }));

      const data = await safeFetchJson(`${BASE_URL}/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });

      // success path
      setMarks(data.totalScore ?? null);
      setExistingSubmission(data.submission ?? { totalScore: data.totalScore ?? null });
      // notify other parts to refresh progress
      try {
        window.dispatchEvent(new CustomEvent("quizSubmitted", { detail: { quizId, totalScore: data.totalScore ?? null } }));
      } catch (e) {
        console.log(e)
      }

      toast.success(`Quiz submitted — Score: ${data.totalScore ?? "N/A"}`);
      navigate(-1);
    } catch (err) {
      console.error("submitQuiz error:", err);
      // handle common "already submitted" message gracefully
      if (err.status === 400 && err.raw && err.raw.includes("Quiz already submitted")) {
        toast.error("You already submitted this quiz — fetching stored score.");
        try {
          const sub = await safeFetchJson(`${BASE_URL}/api/quizzes/${quizId}/submission`, { method: "GET" });
          setExistingSubmission(sub);
          setMarks(sub.totalScore ?? null);
        } catch (fetchErr) {
          console.warn("failed to fetch existing submission after 400:", fetchErr);
        }
        return;
      }

      if (err.raw) {
        console.log("Server raw response (first 1000 chars):", err.raw.slice(0, 1000));
        toast.error("Server returned an unexpected response. Check console.");
      } else {
        toast.error(err.message || "Submission error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <main className="flex-1 p-6 lg:p-12">
          <div className="max-w-3xl mx-auto">
            <div className="h-40 flex items-center justify-center text-slate-500">
              Loading quiz…
            </div>
          </div>
        </main>
      </div>
    );

  if (!questions || questions.length === 0)
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <main className="flex-1 p-6 lg:p-12">
          <Toaster />
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 text-center">
            <div className="text-lg font-semibold text-slate-700">No questions available for this quiz.</div>
            <div className="mt-4">
              <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          </div>
        </main>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster position="top-right" />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h1 className="text-2xl font-semibold text-slate-900">Take Quiz</h1>
            </div>

            <div className="text-sm text-slate-600">
              <div className="font-medium text-slate-800">{answeredCount}/{totalQuestions} answered</div>
              <div className="w-40 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(answeredCount / Math.max(1, totalQuestions)) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((q, idx) => (
            
              <div key={q._id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              {console.log("his",q,idx)}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Question {idx + 1}</div>
                    <div className="text-base font-medium text-slate-800">{q.questionText}</div>
                  </div>
                  {answers[q._id] && (
                    <div className="text-sm text-emerald-600 inline-flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Answered</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  {Array.isArray(q.options) && q.options.map((opt, i) => {
                    const isSelected = answers[q._id] === opt.text;
                    return (
                      <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border ${isSelected ? "border-indigo-600 bg-indigo-50" : "border-transparent hover:border-gray-200"}`}>
                        <input type="radio" name={q._id} checked={isSelected} onChange={() => onSelect(q._id, opt.text)} className="form-radio h-4 w-4 text-indigo-600" />
                        <div className="text-sm text-slate-800">{opt.text}</div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded text-sm bg-white border border-gray-200 text-slate-700 hover:bg-gray-50">Cancel</button>

            <button onClick={handleSubmit} disabled={submitting || !allAnswered || !!existingSubmission} className={`px-4 py-2 rounded text-sm text-white ${submitting || !allAnswered || !!existingSubmission ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}>
              {existingSubmission ? "Already submitted" : (submitting ? "Submitting..." : "Submit Quiz")}
            </button>
          </div>

          {marks !== null && (
            <div className="mt-4 text-right text-sm text-slate-700">
              <strong>Score:</strong> {marks}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
