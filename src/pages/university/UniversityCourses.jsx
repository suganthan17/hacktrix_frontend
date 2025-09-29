import React, { useEffect, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import { BASE_URL } from "../../config";
import UniversityStudents from "./UniversityStudents";

export default function UniversityCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${BASE_URL.replace(/\/$/, "")}/api/courses/university`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText} ${txt}`);
        }
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(String(err));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this course?")) return;
    try {
      const url = `${BASE_URL.replace(/\/$/, "")}/api/courses/${encodeURIComponent(
        id
      )}`;
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText} ${txt}`);
      }
      setCourses((prev) =>
        prev.filter((c) => String(c._id || c.id) !== String(id))
      );
    } catch (err) {
      alert("Delete failed: " + String(err));
      console.error(err);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <UniversitySidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-6 text-slate-800">
            My Courses
          </h1>

          {loading ? (
            <div className="flex items-center justify-center h-40">Loading courses…</div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No courses added yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <article
                  key={course._id || course.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-150"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {course.name || course.title}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {course.category || "General"}
                      </p>
                    </div>
                    <div className="text-sm text-slate-400">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <p className="text-gray-700 mt-4 line-clamp-3">
                    {course.description || "No description provided."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <div className="text-xs text-slate-400">Duration</div>
                      <div className="font-medium">
                        {course.duration ?? "N/A"} weeks
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Schedule</div>
                      <div className="font-medium">
                        {new Date(course.startDate).toLocaleDateString()} —{" "}
                        {new Date(course.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCourse(course._id)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
                    >
                      View Students
                    </button>
                    <button
                      onClick={() => handleDelete(course._id || course.id)}
                      className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {selectedCourse && (
            <div className="mt-8">
              <UniversityStudents courseId={selectedCourse} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
