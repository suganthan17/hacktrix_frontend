import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";

const BACKEND_BASE = "http://localhost:5000";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/courses/public/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Course not found");

        if (!data.videoUrl) {
          toast.error("You must enroll to access this course");
          return navigate("/enrolled-courses");
        }

        setCourse(data);
      } catch (err) {
        toast.error(err.message);
        navigate("/enrolled-courses");
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [id, navigate]);

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  if (loading) return <div className="p-6">Loading course…</div>;
  if (!course) return <div className="p-6">Course not found</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster />
        <div className="max-w-4xl mx-auto">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-indigo-600 mb-6 hover:underline"
          >
            ← Back to Courses
          </button>

          {/* Course Header */}
          <div className="bg-white shadow rounded-2xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{course.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                {course.category || "General"}
              </span>
              {course.duration && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  {course.duration} weeks
                </span>
              )}
              {course.startDate && course.endDate && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  {fmtDate(course.startDate)} — {fmtDate(course.endDate)}
                </span>
              )}
            </div>
          </div>

          {/* Video Section */}
          <div className="bg-white shadow rounded-2xl overflow-hidden mb-6">
            <video
              controls
              className="w-full h-96 object-cover"
              src={`${BACKEND_BASE}${course.videoUrl}`}
              controlsList="nodownload"
            />
          </div>

          {/* Course Description */}
          <div className="bg-white shadow rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Course Overview</h2>
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
