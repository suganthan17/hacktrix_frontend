// src/pages/TakeQuiz.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";

const BASE_URL = "http://localhost:5000";

export default function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/quizzes/${quizId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load quiz");
        setQuestions(Array.isArray(data) ? data : []);
        // keep answers emptied when quiz changes
        setAnswers({});
      } catch (err) {
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

    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q._id,
        answerText: answers[q._id],
      }));

      const res = await fetch(`${BASE_URL}/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers: payload }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Submission failed");

      toast.success(`Quiz submitted — Score: ${data.totalScore ?? "N/A"}`);
      navigate(-1);
    } catch (err) {
      toast.error(err.message || "Submission error");
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
            <div className="text-lg font-semibold text-slate-700">
              No questions available for this quiz.
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
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
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h1 className="text-2xl font-semibold text-slate-900">
                Take Quiz
              </h1>
            </div>

            <div className="text-sm text-slate-600">
              <div className="font-medium text-slate-800">
                {answeredCount}/{totalQuestions} answered
              </div>
              <div className="w-40 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${
                      (answeredCount / Math.max(1, totalQuestions)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q._id}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">
                      Question {idx + 1}
                    </div>
                    <div className="text-base font-medium text-slate-800">
                      {q.questionText}
                    </div>
                  </div>
                  {answers[q._id] && (
                    <div className="text-sm text-emerald-600 inline-flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Answered</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  {Array.isArray(q.options) &&
                    q.options.map((opt, i) => {
                      const isSelected = answers[q._id] === opt.text;
                      return (
                        <label
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50"
                              : "border-transparent hover:border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q._id}
                            checked={isSelected}
                            onChange={() => onSelect(q._id, opt.text)}
                            className="form-radio h-4 w-4 text-indigo-600"
                          />
                          <div className="text-sm text-slate-800">
                            {opt.text}
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded text-sm bg-white border border-gray-200 text-slate-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className={`px-4 py-2 rounded text-sm text-white ${
                submitting || !allAnswered
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
