import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";

const BACKEND_BASE = "http://localhost:5000";

export default function EnrolledCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch enrolled courses
  const fetchEnrolledCourses = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/courses/public`, {
        credentials: "include",
      });
      const data = await res.json();
      const enrolled = data.filter((c) => c.enrolled); // only enrolled courses
      setCourses(enrolled);
    } catch (err) {
      toast.error("Failed to fetch enrolled courses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  // Cancel enrollment
  const handleCancel = async (courseId) => {
    try {
      const res = await fetch(
        `${BACKEND_BASE}/api/enrollments/${courseId}/cancel`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cancellation failed");
      toast.success(data.message);
      setCourses(courses.filter((c) => c._id !== courseId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster />
        <h1 className="text-2xl font-bold mb-6">My Enrolled Courses</h1>

        {loading ? (
          <div>Loading enrolled courses…</div>
        ) : courses.length === 0 ? (
          <div>No enrolled courses yet</div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition p-6"
              >
                <h2 className="text-xl font-semibold text-slate-900">{course.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{course.category || "General"}</p>

                <div className="mt-5 flex justify-center gap-2">
                  <button
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Go to Course
                  </button>
                  <button
                    onClick={() => handleCancel(course._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Cancel Enrollment
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
