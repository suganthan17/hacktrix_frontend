// src/pages/TakeQuiz.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
        console.log("Quiz questions:", data); // 🔎 Debug
        if (!res.ok)
          throw new Error(data.message || "Failed to load quiz questions");
        setQuestions(data);
      } catch (err) {
        toast.error(err.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId]);

  const onSelect = (questionId, optionText) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionText }));
  };

  const handleSubmit = async () => {
    if (questions.some((q) => !answers[q._id])) {
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

  if (loading) return <div className="p-6">Loading quiz...</div>;
  if (!questions || questions.length === 0)
    return <div className="p-6">No questions available for this quiz.</div>;

  return (
    <div className="p-6">
      <button
        className="mb-4 text-sm text-blue-600"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-4">Take Quiz</h1>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q._id} className="border p-4 rounded">
            <div className="font-medium">
              Q{idx + 1}. {q.questionText}
            </div>
            <div className="mt-2 space-y-2">
              {q.options.map((opt, i) => (
                <label key={i} className="block cursor-pointer">
                  <input
                    type="radio"
                    name={q._id}
                    checked={answers[q._id] === opt.text}
                    onChange={() => onSelect(q._id, opt.text)}
                    className="mr-2"
                  />
                  {opt.text}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`px-4 py-2 rounded text-white ${
            submitting ? "bg-gray-400" : "bg-green-600"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Quiz"}
        </button>
      </div>
    </div>
  );
}
