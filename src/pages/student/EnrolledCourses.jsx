import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, ArrowRight, User, X } from "lucide-react";

const BACKEND_BASE = "http://localhost:5000";

export default function EnrolledCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({
    open: false,
    courseId: null,
    name: "",
  });

  const navigate = useNavigate();

  const fetchEnrolledCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_BASE}/api/courses/public`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      const enrolled = Array.isArray(data) ? data.filter((c) => c.enrolled) : [];
      setCourses(enrolled);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load enrolled courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrolledCourses();
    // close modal on Escape
    const onKey = (e) => {
      if (e.key === "Escape") setConfirm({ open: false, courseId: null, name: "" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fetchEnrolledCourses]);

  const openCancelModal = (courseId, name) =>
    setConfirm({ open: true, courseId, name });
  const closeCancelModal = () =>
    setConfirm({ open: false, courseId: null, name: "" });

  const handleCancel = async () => {
    const { courseId } = confirm;
    if (!courseId) return;
    try {
      const res = await fetch(
        `${BACKEND_BASE}/api/enrollments/${courseId}/cancel`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cancellation failed");
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      toast.success(data.message || "Enrollment cancelled");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to cancel enrollment");
    } finally {
      closeCancelModal();
    }
  };

  const PALETTE = [
    ["#06B6D4", "#0E7490"],
    ["#EF4444", "#B91C1C"],
    ["#7C3AED", "#4C1D95"],
    ["#F43F5E", "#BE123C"],
    ["#0EA5A4", "#065F46"],
    ["#4F46E5", "#4338CA"],
    ["#F97316", "#C2410C"],
    ["#0EA5A4", "#065F46"],
  ];

  const pickGradient = (course, i) => {
    const key = (course.category || course.name || "").toString();
    let idx = 0;
    for (let ch of key) idx = (idx * 31 + ch.charCodeAt(0)) % PALETTE.length;
    idx = (typeof idx === "number" ? idx : i) % PALETTE.length;
    const [a, b] = PALETTE[idx];
    return `linear-gradient(135deg, ${a}, ${b})`;
  };

  const initials = (name = "") => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "S";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  // small helper: safe progress 0-100
  const progressValue = (course) => {
    const p = Number(course?.progress ?? course?.percentage ?? 0);
    if (isNaN(p)) return 0;
    return Math.max(0, Math.min(100, p));
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster position="top-right" />
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 mb-6 flex-col md:flex-row">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Enrolled Courses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                A compact, modern view of your active learning — access, track and manage enrollments.
              </p>
            </div>

            <div className="flex items-center gap-4 mt-3 md:mt-0">
              <div className="bg-white rounded-2xl shadow px-4 py-3 flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 p-2 shadow-sm text-white">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-sm">
                  <div className="text-xs text-slate-400">Active</div>
                  <div className="text-lg font-bold text-slate-800">{courses.length}</div>
                </div>
              </div>

              <button
                onClick={() => navigate("/student-courses")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white font-medium shadow hover:scale-[1.02] transition-transform"
                aria-label="Browse courses"
              >
                Browse Courses
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Card area */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 animate-pulse"
                  >
                    <div className="w-36 h-20 rounded-lg bg-slate-200" />
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-slate-200 rounded w-3/5 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-3" />
                      <div className="h-2 bg-slate-200 rounded w-2/3" />
                    </div>
                    <div className="w-28 h-10 bg-slate-200 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-lg font-medium text-slate-700">
                  No enrolled courses yet
                </div>
                <div className="text-sm text-slate-500 mt-2">Go to Browse to enroll.</div>
                <div className="mt-6">
                  <button
                    onClick={() => navigate("/student-courses")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Browse Courses
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course, idx) => {
                  const gradient = pickGradient(course, idx);
                  const prog = progressValue(course);
                  const completed = prog >= 100;
                  return (
                    <div
                      key={course._id}
                      className="flex items-center gap-4 p-4 rounded-lg hover:shadow-lg transition-shadow bg-white"
                      style={{ borderLeft: "6px solid rgba(0,0,0,0.04)" }}
                    >
                      {/* Left: thumbnail */}
                      <div
                        className="w-36 h-20 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 relative"
                        style={{ background: gradient }}
                        aria-hidden
                      >
                        {course.thumbnail ? (
                          <img
                            src={`${BACKEND_BASE}${course.thumbnail}`}
                            alt={course.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <div className="text-white font-semibold text-xl">
                              {initials(course.name)}
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                      </div>

                      {/* Center */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {course.name}
                          </h3>

                          <span
                            className="px-2 py-0.5 text-xs rounded-full font-semibold text-white"
                            style={{
                              background: gradient,
                              boxShadow: "0 6px 14px rgba(12,12,12,0.06)",
                            }}
                          >
                            {course.category || "General"}
                          </span>

                          {course.university?.name && (
                            <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-slate-100 text-slate-700">
                              {course.university.name}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                          {course.description || "No description available."}
                        </p>

                        {/* progress bar + meta */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-300`}
                                style={{
                                  width: `${prog}%`,
                                  background: completed ? "linear-gradient(90deg,#06B6D4,#4F46E5)" : gradient,
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                              <div>{completed ? "Completed" : `${prog}% complete`}</div>
                              <div>{course.duration ? `${course.duration} weeks` : "Duration: N/A"}</div>
                            </div>
                          </div>

                          {/* small action summary */}
                          <div className="text-xs text-slate-400 whitespace-nowrap">
                            {course.startDate ? new Date(course.startDate).toLocaleDateString() : "—"}
                          </div>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/courses/${course._id}`)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-white font-medium shadow-md hover:scale-[1.02] transition-transform"
                            style={{
                              background: "linear-gradient(90deg,#06B6D4,#4F46E5)",
                            }}
                            aria-label={`Open ${course.name}`}
                          >
                            <ArrowRight className="h-4 w-4" />
                            Open
                          </button>
                        </div>

                        <button
                          onClick={() => openCancelModal(course._id, course.name)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-red-100 text-red-600 hover:bg-red-50"
                          aria-label={`Cancel ${course.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {confirm.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeCancelModal}
            aria-hidden
          />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Cancel Enrollment
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  Are you sure you want to cancel enrollment for{" "}
                  <span className="font-medium text-slate-800">{confirm.name}</span>?
                </p>
              </div>

              <button
                onClick={closeCancelModal}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700"
              >
                Close
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
