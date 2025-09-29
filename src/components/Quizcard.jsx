// src/components/QuizCard.jsx
import React from "react";

export default function QuizCard({ quiz, onTake }) {
  return (
    <div className="border rounded p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{quiz.title}</h3>
          {quiz.description && (
            <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
          )}
        </div>
        <div>
          <button
            onClick={() => onTake(quiz._id)}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Take Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
