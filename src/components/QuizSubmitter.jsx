import React, { useState } from "react";

const BACKEND_BASE = "http://localhost:5000";

export default function QuizSubmitter({ quizId, questions = [] }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (qId, optionText) => {
    setAnswers((s) => ({ ...s, [qId]: optionText }));
  };

  const handleSubmit = async () => {
    const payload = {
      answers: Object.entries(answers).map(([questionId, answerText]) => ({
        questionId,
        answerText,
      })),
    };
    try {
      setSubmitting(true);
      const res = await fetch(`${BACKEND_BASE}/api/quizzes/${quizId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        alert(body?.message || "Submit failed");
        return;
      }
      alert(`Submitted! Score: ${body.totalScore}`);
    } catch (err) {
      console.error("submit fetch error", err);
      alert("An error occurred while submitting");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {questions.map((q) => (
        <div key={q._id} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>{q.questionText}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(q._id, opt.text)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: answers[q._id] === opt.text ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  background: answers[q._id] === opt.text ? "#e0f2ff" : "#fff",
                }}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={handleSubmit} disabled={submitting} style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", borderRadius: 8 }}>
        {submitting ? "Submitting..." : "Submit Quiz"}
      </button>
    </div>
  );
}
