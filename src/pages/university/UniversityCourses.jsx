// src/pages/university/UniversityCourses.jsx
import React, { useEffect, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import { BASE_URL } from "../../config";
import UniversityStudents from "./UniversityStudents";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, Users, Calendar } from "lucide-react";

export default function UniversityCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fmtDateSafe = (d) => {
    try {
      if (!d) return "—";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "—";
      return dt.toLocaleDateString();
    } catch {
      return "—";
    }
  };

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
    if (!window.confirm("Delete this course? This action cannot be undone."))
      return;
    try {
      const url = `${BASE_URL.replace(
        /\/$/,
        ""
      )}/api/courses/${encodeURIComponent(id)}`;
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
      toast.success("Course deleted");
    } catch (err) {
      toast.error("Delete failed");
      alert("Delete failed: " + String(err));
      console.error(err);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <UniversitySidebar />
      <main className="flex-1 p-8">
        <Toaster position="top-right" />
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800">
                My Courses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage courses published by your university — view students or
                remove a course.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-sm border border-gray-100">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div className="text-sm text-slate-700 font-medium">
                  {courses.length}
                </div>
                <div className="text-xs text-slate-400 ml-1">courses</div>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="flex items-center justify-center h-44 text-slate-500">
              Loading courses…
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-red-700">
              {error}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-lg font-medium text-slate-700">
                No courses added yet.
              </div>
              <div className="mt-3 text-sm">
                Use the Add Course page to publish new courses.
              </div>
              <div className="mt-6">
                <a
                  href="/university-addcourse"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Course
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => {
                const id = course._id || course.id;
                return (
                  <article
                    key={id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-150 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-semibold text-slate-900 truncate">
                          {course.name || course.title}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          {course.category || "General"}
                        </p>
                      </div>

                      <div className="text-sm text-slate-400 whitespace-nowrap">
                        {fmtDateSafe(course.createdAt)}
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
                          {fmtDateSafe(course.startDate)} —{" "}
                          {fmtDateSafe(course.endDate)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      <button
                        onClick={() => setSelectedCourse(id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                      >
                        <Users className="w-4 h-4" />
                        View Students
                      </button>

                      <button
                        onClick={() => handleDelete(id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
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
