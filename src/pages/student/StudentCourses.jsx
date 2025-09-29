import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";

const BACKEND_BASE = "http://localhost:5000";

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/courses/public`, {
        credentials: "include",
      });
      const data = await res.json();
      setCourses(data.map((c) => ({ ...c, enrolled: false })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      const res = await fetch(
        `${BACKEND_BASE}/api/enrollments/${courseId}/enroll`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Enrollment failed");
      toast.success(data.message);
      setCourses(
        courses.map((c) => (c._id === courseId ? { ...c, enrolled: true } : c))
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster />
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Available Courses</h1>
          {loading ? (
            <div>Loading courses…</div>
          ) : courses.length === 0 ? (
            <div>No courses available</div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <article
                  key={c._id}
                  className="bg-white rounded-lg shadow p-4 border hover:shadow-md transition"
                >
                  <div className="h-40 bg-slate-100 rounded mb-3 overflow-hidden flex items-center justify-center">
                    {c.videoUrl ? (
                      <video
                        src={`${BACKEND_BASE}${c.videoUrl}`}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        controls={false}
                      />
                    ) : (
                      <span className="text-sm text-slate-500">
                        No preview available
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 mb-2">
                    {c.name}
                  </h2>
                  <div className="mt-3 text-xs text-slate-500 flex flex-wrap gap-2">
                    {c.category && (
                      <span className="px-2 py-1 bg-slate-100 rounded">
                        {c.category}
                      </span>
                    )}
                    {c.duration && (
                      <span className="px-2 py-1 bg-slate-100 rounded">
                        {c.duration}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {c.enrolled ? (
                      <button
                        onClick={() => navigate(`/courses/${c._id}`)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Go to Course
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Enroll
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
