// src/components/QuizCard.jsx
import React from "react";

export default function QuizCard({ quiz }) {
  const statusColor =
    quiz.status === "completed"
      ? "bg-[rgba(34,197,94,0.12)] text-green-600"
      : quiz.status === "pending"
      ? "bg-[rgba(239,68,68,0.12)] text-red-600"
      : "bg-[rgba(99,102,241,0.12)] text-indigo-600";

  return (
    <div className="p-5 rounded-lg border border-border bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase text-muted-foreground tracking-wide">Quiz</div>
          <div className="font-semibold text-foreground">{quiz.title}</div>
        </div>
        <div className="text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor}">
          {quiz.status || "upcoming"}
        </div>
      </div>

      {/* Description */}
      {quiz.description && (
        <div className="mt-3 text-sm text-muted-foreground">{quiz.description}</div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          {quiz.marks ? `Marks: ${quiz.marks}` : "No marks info"}
        </div>
        <button className="px-3 py-1.5 rounded-md bg-gradient-to-r from-primary to-accent text-white text-sm font-medium hover:opacity-90">
          {quiz.status === "completed"
            ? "Review"
            : quiz.status === "in-progress"
            ? "Continue"
            : "Start"}
        </button>
      </div>
    </div>
  );
}
