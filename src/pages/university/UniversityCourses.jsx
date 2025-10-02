// src/pages/university/UniversityCourses.jsx
import React, { useEffect, useMemo, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import { BASE_URL } from "../../config";
import toast, { Toaster } from "react-hot-toast";
import {
  Trash2,
  Users,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
              <h1 className="text-3xl font-extrabold text-slate-900">
                My Courses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Grid or List view — darker, modern buttons. “View Students”
                replaces View.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-full bg-white shadow-sm border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    viewMode === "list"
                      ? "bg-pink-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  List
                </button>
              </div>
              <Link
                to="/university-addcourse"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-md bg-gradient-to-r from-indigo-700 to-blue-600 hover:from-indigo-800 hover:to-blue-700"
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
                  className="animate-pulse bg-white rounded-2xl p-4 h-44 shadow-sm border border-gray-100"
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
              <div className="mt-3 text-sm">Add a course to get started.</div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageItems.map((course) => {
                const id = course._id || course.id;
                return (
                  <article
                    key={id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow hover:shadow-md transform hover:-translate-y-1 transition"
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">
                        {course.name || course.title}
                      </h3>
                      <div className="text-xs text-slate-400 mt-2 flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {course.category || "General"}
                        </span>
                        <span>{fmtDateSafe(course.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-3 line-clamp-3">
                        {course.description || "No description provided."}
                      </p>

                      <div className="mt-4 flex items-center gap-3 justify-end">
                        <Link
                          to="/university-students"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Users className="w-4 h-4" /> View Students
                        </Link>
                        <Link
                          to={`/university-course-edit/${id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-slate-600 text-white hover:bg-slate-700"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 items-center px-4 py-3 border-b border-gray-100 text-xs text-slate-500 bg-slate-50">
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
                      className="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-slate-50 transition border-b last:border-b-0"
                    >
                      <div className="col-span-7 flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded border bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">
                          {initials(course.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {course.name || course.title}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
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
                          className="text-blue-600 hover:text-blue-800"
                          aria-label={`View Students for ${course.name}`}
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/university-course-edit/${id}`}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(id)}
                          className="text-red-600 hover:text-red-800"
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
              <div className="inline-flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => clamp(p - 1, 1, totalPages))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white border shadow-sm disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 text-sm bg-white border rounded">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => clamp(p + 1, 1, totalPages))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white border shadow-sm disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
