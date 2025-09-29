import React, { useEffect, useState } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";

const BACKEND_BASE = "http://localhost:5000";

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/courses/public`, {
        credentials: "include",
      });
      const data = await res.json();
      setCourses(data); 
    } catch (err) {
      toast.error("Failed to fetch courses");
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
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Enrollment failed");

      toast.success(data.message);

      // Update local state immediately
      setCourses(
        courses.map((c) =>
          c._id === courseId ? { ...c, enrolled: true } : c
        )
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Format date helper
  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster />
        <h1 className="text-3xl font-bold mb-6 text-slate-800">Browse Courses</h1>

        {loading ? (
          <div className="flex items-center justify-center h-40">Loading courses…</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No courses available</div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition p-6"
              >
                {/* Video Preview */}
                <div className="h-40 bg-slate-100 rounded mb-4 overflow-hidden flex items-center justify-center">
                  {course.videoUrl ? (
                    <video
                      src={`${BACKEND_BASE}${course.videoUrl}`}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      controls={false}
                    />
                  ) : (
                    <span className="text-sm text-slate-500">No preview available</span>
                  )}
                </div>

                {/* Course Info */}
                <h2 className="text-xl font-semibold text-slate-900">{course.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{course.category || "General"}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <div className="text-xs text-slate-400">Duration</div>
                    <div className="font-medium">{course.duration ?? "N/A"} weeks</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Schedule</div>
                    <div className="font-medium">
                      {fmtDate(course.startDate)} — {fmtDate(course.endDate)}
                    </div>
                  </div>
                </div>

                {/* Enroll Button */}
                <div className="mt-5 flex justify-center">
                  {course.enrolled ? (
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded cursor-not-allowed opacity-70"
                      disabled
                    >
                      Enrolled
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course._id)}
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
      </main>
    </div>
  );
}
