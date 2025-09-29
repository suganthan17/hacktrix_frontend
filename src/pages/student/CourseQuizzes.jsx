// src/pages/CourseQuizzes.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BACKEND_BASE } from "../config";
import QuizCard from "../components/QuizCard";
import toast from "react-hot-toast";

export default function CourseQuizzes() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${BACKEND_BASE}/api/quizzes/course/${courseId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load quizzes");
        setQuizzes(data);
      } catch (err) {
        toast.error(err.message || "Failed to load quizzes");
      }
    };
    load();
  }, [courseId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Quizzes</h1>
      <div className="mt-4 space-y-3">
        {quizzes.map((q) => (
          <QuizCard
            key={q._id}
            quiz={q}
            onTake={(id) => navigate(`/quizzes/${id}/take`)}
          />
        ))}
      </div>
    </div>
  );
}
