// src/pages/university/UniversityCourses.jsx
import React, { useEffect, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import { BASE_URL } from "../../config";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

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

const PALETTE = [
  ["#7C3AED", "#4C1D95"],
  ["#0EA5A4", "#065F46"],
  ["#F97316", "#C2410C"],
  ["#06B6D4", "#0E7490"],
  ["#EF4444", "#B91C1C"],
  ["#4F46E5", "#4338CA"],
  ["#F43F5E", "#BE123C"],
  ["#0EA5A4", "#065F46"],
];

const pickGradient = (key = "", idxFallback = 0) => {
  let idx = 0;
  for (let ch of String(key))
    idx = (idx * 31 + ch.charCodeAt(0)) % PALETTE.length;
  idx = idx % PALETTE.length;
  const [a, b] = PALETTE[idx || idxFallback % PALETTE.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
};

const initials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

export default function UniversityCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      toast.success("Course deleted");
      // optionally refresh list after deletion:
      setCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
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
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
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

              <a
                href="/university-addcourse"
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 text-sm"
              >
                Add Course
              </a>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, idx) => {
                const id = course._id || course.id;
                const gradient = pickGradient(
                  course.category || course.name || id,
                  idx
                );
                return (
                  <article
                    key={id}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden flex flex-col"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-24 h-16 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 relative"
                        style={{ background: gradient }}
                      >
                        {course.thumbnail ? (
                          <img
                            src={`${BASE_URL.replace(/\/$/, "")}${
                              course.thumbnail
                            }`}
                            alt={course.name}
                            className="w-full h-full object-cover opacity-95"
                          />
                        ) : (
                          <div className="text-white font-semibold text-lg">
                            {initials(course.name)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">
                          {course.name || course.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 text-xs rounded-full font-medium"
                            style={{
                              background: gradient,
                              color: "#fff",
                              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
                            }}
                          >
                            {course.category || "General"}
                          </span>

                          <span className="text-xs text-slate-400 ml-auto">
                            {fmtDateSafe(course.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 mt-3 line-clamp-3">
                          {course.description || "No description provided."}
                        </p>

                        <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                          <div>
                            <div className="text-xs text-slate-400">
                              Duration
                            </div>
                            <div className="font-medium">
                              {course.duration ?? "N/A"} weeks
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">
                              Schedule
                            </div>
                            <div className="font-medium">
                              {fmtDateSafe(course.startDate)} —{" "}
                              {fmtDateSafe(course.endDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-3">
                      {/* Client-side navigation to the students page */}
                      <Link
                        to="/university-students"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                      >
                        <Users className="w-4 h-4" />
                        View Students
                      </Link>

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
        </div>
      </main>
    </div>
  );
}
