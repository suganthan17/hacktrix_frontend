// src/pages/student/CourseDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  PlayCircle,
  User,
  BookOpen,
  CheckCircle,
  PlusCircle,
} from "lucide-react";

const BACKEND_BASE = "http://localhost:5000";

export default function CourseDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const fetchCourseAndQuizzes = async () => {
      try {
        setLoading(true);

        // 1. fetch course details
        const res = await fetch(`${BACKEND_BASE}/api/courses/public/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Course not found");
        setCourse(data);

        // 2. fetch quizzes for this course
        const quizRes = await fetch(
          `${BACKEND_BASE}/api/quizzes/course/${id}`,
          {
            credentials: "include",
          }
        );
        const quizData = await quizRes.json();
        if (quizRes.ok && Array.isArray(quizData)) {
          // remove duplicate quizzes by _id
          const unique = quizData.filter(
            (q, i, arr) => i === arr.findIndex((x) => x._id === q._id)
          );
          setQuizzes(unique);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load course");
        navigate("/enrolled-courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndQuizzes();
  }, [id, navigate]);

 

  if (loading)
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <main className="flex-1 p-6 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="h-44 flex items-center justify-center text-slate-500">
              Loading course…
            </div>
          </div>
        </main>
      </div>
    );

  if (!course)
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <main className="flex-1 p-6 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="p-6 bg-white rounded-xl shadow text-center">
              <div className="text-lg font-semibold text-slate-700">
                Course not found
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate("/courses")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Back to Courses
                </button>
              </div>
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

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main column */}
          <section className="md:col-span-2 bg-white rounded-2xl shadow p-6 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Category</span>
                <span className="px-2 py-0.5 text-xs bg-slate-100 rounded-full text-slate-700">
                  {course.category || "General"}
                </span>
              </div>
            </div>

            {/* title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                {course.name}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {course.tagline || ""}
              </p>
            </div>

            {/* video */}
            {course.videoUrl ? (
              <div className="w-full rounded-xl overflow-hidden bg-black/5">
                <video
                  src={`${BACKEND_BASE}${course.videoUrl}`}
                  controls
                  controlsList="nodownload"
                  className="w-full h-72 md:h-96 object-cover bg-black"
                  poster={course.thumbnail || ""}
                />
              </div>
            ) : (
              <div className="w-full rounded-xl h-56 md:h-72 bg-slate-100 flex items-center justify-center text-slate-400">
                <PlayCircle className="h-12 w-12" />
                <div className="ml-3 text-sm">No preview available</div>
              </div>
            )}

            {/* description */}
            {course.description && (
              <div className="prose prose-sm max-w-none text-slate-700">
                <h3 className="text-lg font-medium">About this course</h3>
                <p>{course.description}</p>
              </div>
            )}

            {/* Quizzes */}
            <div>
              <h3 className="text-lg font-medium mb-3">Quizzes</h3>
              {quizzes.length === 0 ? (
                <div className="text-sm text-slate-500">
                  No quizzes for this course.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quizzes.map((q) => (
                    <div
                      key={q._id}
                      className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        <div className="text-sm font-medium text-slate-800">
                          {q.title}
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => navigate(`/quiz/${q._id}`)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Take Quiz
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right column: instructor / actions */}
          <aside className="md:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white text-xl font-semibold mb-3">
                  {course.instructor ? (
                    course.instructor
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {course.instructor || "Instructor"}
                </div>
                {course.instructorEmail && (
                  <div className="text-xs text-slate-500 mt-1">
                    {course.instructorEmail}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <div className="text-xs text-slate-500 mb-2">
                  Course details
                </div>
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <div className="font-medium">Duration</div>
                  <div>
                    {course.duration ? `${course.duration} weeks` : "—"}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-700 mt-2">
                  <div className="font-medium">Lessons</div>
                  <div>{course.lessons ?? "—"}</div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-700 mt-2">
                  <div className="font-medium">Category</div>
                  <div>{course.category || "General"}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
