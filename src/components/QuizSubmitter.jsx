// src/components/QuizSubmitter.jsx
import React, { useState } from "react";

const BACKEND_BASE = "http://localhost:5000";

export default function QuizSubmitter({ quizId, questions = [] }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const getQId = (q) => q._id || q.id || q.questionId || "";

  const handleSelect = (q, opt) => {
    const qid = String(getQId(q));
    let answerText = "";
    let optionId = null;
    if (opt === null || opt === undefined) {
      answerText = "";
      optionId = null;
    } else if (typeof opt === "string") {
      answerText = opt;
      optionId = null;
    } else if (typeof opt === "object") {
      answerText = opt.text ?? opt.value ?? opt.label ?? "";
      optionId = opt.id ?? opt.optionId ?? opt._id ?? null;
      if (!answerText) answerText = String(opt);
    }
    setAnswers((s) => ({
      ...s,
      [qid]: { answerText: answerText ?? "", optionId: optionId ?? null },
    }));
  };

  const handleSubmit = async () => {
    const missing = [];
    for (const q of questions) {
      const qid = String(getQId(q));
      if (!answers[qid] || !answers[qid].answerText) {
        missing.push(qid);
      }
    }
    if (missing.length > 0) {
      const human = missing
        .map((qid) => {
          const idx = questions.findIndex((qq) => String(getQId(qq)) === qid);
          const text = idx >= 0 ? questions[idx].questionText : "";
          return `${idx + 1}${text ? ` (${text.slice(0, 30)})` : ""}`;
        })
        .join(", ");
      alert(`Please answer all questions. Missing: ${human}`);
      return;
    }

    const payload = {
      answers: Object.entries(answers).map(([questionId, val]) => ({
        questionId,
        answerText: val.answerText ?? "",
        optionId: val.optionId ?? null,
      })),
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${BACKEND_BASE}/api/quizzes/${quizId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");
      const ct = res.headers.get("content-type") || "";

      if (!res.ok) {
        let parsed = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch (e) {
          console.log(e);
        }
        alert(
          parsed?.message ||
            parsed?.error ||
            `Submit failed (status ${res.status})`
        );
        return;
      }

      let body = null;
      if (ct.includes("application/json")) {
        try {
          body = text ? JSON.parse(text) : {};
        } catch (err) {
          alert("Server returned invalid JSON. See console for details.");
          console.error("submit parse error", err, text);
          return;
        }
      } else {
        window.dispatchEvent(new Event("quizSubmitted"));
        alert("Submitted (server returned non-JSON response).");
        return;
      }

      const totalScore =
        body?.totalScore ??
        body?.score ??
        body?.submission?.totalScore ??
        body?.result?.totalScore ??
        null;

      if (totalScore !== null && totalScore !== undefined) {
        alert(`Submitted! Score: ${totalScore}`);
      } else if (body?.message) {
        alert(body.message);
      } else {
        alert("Submitted successfully.");
      }

      try {
        window.dispatchEvent(new Event("quizSubmitted"));
      } catch (e) {
        console.log(e);
      }
    } catch (err) {
      console.error("submit fetch error", err);
      alert("An error occurred while submitting. See console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {questions.map((q, qi) => {
        const qid = String(getQId(q));
        const selected = answers[qid]?.optionId ?? null;
        return (
          <div key={qid || qi} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>
              {q.questionText || `Question ${qi + 1}`}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {Array.isArray(q.options) && q.options.length > 0 ? (
                q.options.map((opt, i) => {
                  const optText =
                    typeof opt === "string"
                      ? opt
                      : opt.text ?? opt.value ?? opt.label ?? String(opt);
                  const optId =
                    typeof opt === "object"
                      ? opt.id ?? opt.optionId ?? opt._id ?? null
                      : null;
                  const isSelected =
                    (selected && optId && String(selected) === String(optId)) ||
                    (answers[qid]?.answerText &&
                      answers[qid].answerText === optText);

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(q, opt)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: isSelected
                          ? "2px solid #2563eb"
                          : "1px solid #e5e7eb",
                        background: isSelected ? "#e0f2ff" : "#fff",
                        cursor: "pointer",
                      }}
                      type="button"
                    >
                      {optText}
                    </button>
                  );
                })
              ) : (
                <input
                  placeholder="Your answer"
                  value={answers[qid]?.answerText ?? ""}
                  onChange={(e) =>
                    setAnswers((s) => ({
                      ...s,
                      [qid]: { answerText: e.target.value, optionId: null },
                    }))
                  }
                  className="px-3 py-2 border rounded"
                />
              )}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 12 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: "10px 16px",
            background: submitting ? "#93c5fd" : "#2563eb",
            color: "#fff",
            borderRadius: 8,
            border: "none",
            cursor: submitting ? "default" : "pointer",
          }}
        >
          {submitting ? "Submitting..." : "Submit Quiz"}
        </button>
      </div>
    </div>
  );
}
