// src/pages/student/CourseDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";

const BACKEND_BASE = "http://localhost:5000";

export default function CourseDetail() {
  const { id } = useParams(); // courseId from route
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const fetchCourseAndQuizzes = async () => {
      try {
        // 1️⃣ Fetch course details
        const res = await fetch(`${BACKEND_BASE}/api/courses/public/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Course not found");
        setCourse(data);

        // 2️⃣ Fetch quizzes for this course
        const quizRes = await fetch(
          `${BACKEND_BASE}/api/quizzes/course/${id}`,
          {
            credentials: "include",
          }
        );
        const quizData = await quizRes.json();
        if (quizRes.ok && Array.isArray(quizData)) {
          // ✅ remove duplicate quizzes by _id
          const unique = quizData.filter(
            (q, i, arr) => i === arr.findIndex((x) => x._id === q._id)
          );
          setQuizzes(unique);
        }
      } catch (err) {
        toast.error(err.message);
        navigate("/enrolled-courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndQuizzes();
  }, [id, navigate]);

  if (loading) return <div className="p-6">Loading course…</div>;
  if (!course) return <div className="p-6">Course not found</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster />
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-indigo-600 mb-4"
          >
            ← Back
          </button>

          {/* Course details */}
          <h1 className="text-2xl font-bold mb-2">{course.name}</h1>
          <p className="text-sm text-gray-500">
            {course.category || "General"}
          </p>
          <p className="text-gray-700">{course.description}</p>

          {/* Video section */}
          {course.videoUrl && (
            <div className="rounded overflow-hidden mt-4">
              <video
                src={`${BACKEND_BASE}${course.videoUrl}`}
                controls
                className="w-full"
                controlsList="nodownload"
              />
            </div>
          )}

          {/* Quiz section */}
          {quizzes.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-3">Quizzes</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {quizzes.map((q) => (
                  <button
                    key={q._id}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    onClick={() => navigate(`/quiz/${q._id}`)}
                  >
                    {q.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
