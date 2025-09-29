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
    const load = async () => {
      try {
        setLoading(true);

        // check enrollment
        const check = await fetch(`${BACKEND_BASE}/api/courses/${id}/check-enrollment`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!check.ok) {
          toast.error("You must enroll to access this course");
          navigate("/student-courses");
          return;
        }

        const res = await fetch(`${BACKEND_BASE}/api/courses/public/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load course");
        if (data.videoUrl && data.videoUrl.startsWith("/")) {
          data.videoUrl = `${BACKEND_BASE}${data.videoUrl}`;
        }
        setCourse(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) return <div className="p-6">Loading course…</div>;
  if (!course) return <div className="p-6">Course not found</div>;

  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster />
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
          <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 mb-4">
            ← Back
          </button>

          <h1 className="text-2xl font-bold mb-2">{course.name}</h1>
          <div className="text-sm text-slate-500 mb-4">
            {course.category && <span className="mr-3">Category: {course.category}</span>}
            {course.duration && <span>Duration: {course.duration}</span>}
          </div>

          {course.videoUrl ? (
            <div className="rounded overflow-hidden mb-6">
              <video
                controls
                preload="metadata"
                className="w-full"
                src={course.videoUrl}
                controlsList="nodownload"
              />
            </div>
          ) : (
            <div className="text-red-500 mb-6">
              You must enroll to access this course video.
            </div>
          )}

          <p className="text-slate-700">{course.description}</p>
        </div>
      </main>
    </div>
  );
}
