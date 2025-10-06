// src/pages/university/UniversityCourses.jsx
import React, { useEffect, useMemo, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import { BASE_URL } from "../../config";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

/* ---------- helpers ---------- */
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
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const initials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

/* ---------- component ---------- */
export default function UniversityCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;
  const base = BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url = `${base}/api/courses/university`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText} ${txt}`);
        }
        const data = await res.json();
        if (!cancelled) setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(String(err));
          console.error("fetch courses:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [base]);

  const handleDelete = async (id) => {
    const ok = window.confirm(
      "Delete this course? This action cannot be undone."
    );
    if (!ok) return;
    try {
      const url = `${base}/api/courses/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText} ${txt}`);
      }
      toast.success("Course deleted");
      setCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
    } catch (err) {
      toast.error("Delete failed");
      console.error("delete failed:", err);
    }
  };

  const filtered = useMemo(() => {
    return courses.slice().sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [courses]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  useEffect(() => setPage((p) => clamp(p, 1, totalPages)), [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  /* ---------- UI ---------- */
  return (
    <div className="flex w-full min-h-screen bg-gradient-to-b from-white to-slate-50">
      <UniversitySidebar />
      <main className="flex-1 p-8">
        <Toaster position="top-right" />
        <div className="max-w-7xl mx-auto">
          {/* header */}
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                My Courses
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                Manage your course catalogue — a modern, clean listing with
                clear actions. Switch between grid and list layouts for
                different workflows.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-full bg-white shadow border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    viewMode === "list"
                      ? "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  List
                </button>
              </div>

              <Link
                to="/university-addcourse"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-md bg-gradient-to-r from-indigo-700 to-blue-600 hover:from-indigo-800 hover:to-blue-700 transform hover:-translate-y-0.5 transition"
              >
                Add Course
              </Link>
            </div>
          </header>

          {/* content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-2xl p-4 h-52 shadow-sm border border-gray-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-rose-700">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-lg font-medium text-slate-700">
                No courses to show.
              </div>
              <div className="mt-3 text-sm">
                Use "Add Course" to create your first course.
              </div>
              <div className="mt-6">
                <Link
                  to="/university-addcourse"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-md bg-gradient-to-r from-indigo-600 to-blue-500"
                >
                  Create course
                </Link>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageItems.map((course) => {
                const id = course._id || course.id;
                return (
                  <article
                    key={id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition"
                  >
                    <div className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {course.name || course.title}
                          </h3>
                          <div className="text-xs text-slate-400 mt-2 flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                              {course.category || "General"}
                            </span>
                            <span>{fmtDateSafe(course.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 mt-4 line-clamp-4">
                        {course.description || "No description provided."}
                      </p>

                      <div className="mt-5 flex items-center gap-3 justify-end">
                        <Link
                          to="/university-students"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-white border border-gray-100 text-slate-700 hover:bg-slate-50"
                          title={`View students for ${course.name}`}
                        >
                          <Users className="w-4 h-4" /> View Students
                        </Link>

                        <button
                          onClick={() => handleDelete(id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 items-center px-6 py-3 border-b border-gray-100 text-xs text-slate-500 bg-slate-50">
                <div className="col-span-7">Course</div>
                <div className="col-span-3 text-center">Category</div>
                <div className="col-span-2 text-right">Created</div>
              </div>
              <div>
                {pageItems.map((course) => {
                  const id = course._id || course.id;
                  return (
                    <div
                      key={id}
                      className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-slate-50 transition border-b last:border-b-0"
                    >
                      <div className="col-span-7 flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-lg border bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-700 font-semibold text-lg">
                          {initials(course.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {course.name || course.title}
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-1">
                            {course.description || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 text-center">
                        <div className="text-sm text-slate-700">
                          {course.category || "General"}
                        </div>
                      </div>

                      <div className="col-span-2 text-right flex items-center gap-3 justify-end">
                        <div className="text-sm text-slate-500">
                          {fmtDateSafe(course.createdAt)}
                        </div>

                        <Link
                          to={`/university-students`}
                          className="text-indigo-600 hover:text-indigo-800"
                          aria-label={`View Students for ${course.name}`}
                        >
                          <Users className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDelete(id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label={`Delete ${course.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* pagination */}
          {filtered.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-medium">{(page - 1) * PER_PAGE + 1}</span>{" "}
                —
                <span className="font-medium">
                  {Math.min(page * PER_PAGE, filtered.length)}
                </span>{" "}
                of <span className="font-medium">{filtered.length}</span>
              </div>

              <nav className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-lg shadow-sm px-2 py-1">
                <button
                  onClick={() => setPage((p) => clamp(p - 1, 1, totalPages))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded disabled:opacity-50 text-slate-600 hover:text-slate-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 text-sm bg-slate-50 rounded">
                  {page} / {totalPages}
                </div>

                <button
                  onClick={() => setPage((p) => clamp(p + 1, 1, totalPages))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded disabled:opacity-50 text-slate-600 hover:text-slate-900"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
