import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";
import { Play, Trash2, ArrowRight, User } from "lucide-react";

const BACKEND_BASE = "http://localhost:5000";

/**
 * Updated EnrolledCourses:
 * - Removed progress bars and "level" chips
 * - Removed descriptions and dates (still not displayed)
 * - Added colorful accents: gradient avatar, colored category pill
 * - Kept custom confirmation modal and existing logic
 */

export default function EnrolledCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({
    open: false,
    courseId: null,
    name: "",
  });
  const navigate = useNavigate();

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_BASE}/api/courses/public`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      const enrolled = Array.isArray(data)
        ? data.filter((c) => c.enrolled)
        : [];
      setCourses(enrolled);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load enrolled courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

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

  // friendly palette for colorful accents
  const PALETTE = [
    ["#7C3AED", "#4C1D95"], // purple
    ["#0EA5A4", "#065F46"], // teal/green
    ["#F97316", "#C2410C"], // orange
    ["#06B6D4", "#0E7490"], // cyan
    ["#EF4444", "#B91C1C"], // red
    ["#0EA5A4", "#065F46"], // repeating some pleasant combos
    ["#4F46E5", "#4338CA"],
    ["#F43F5E", "#BE123C"],
  ];

  const pickGradient = (course, i) => {
    // prefer category-based hash, else index
    const key = (course.category || course.name || "").toString();
    let idx = 0;
    for (let ch of key) idx = (idx * 31 + ch.charCodeAt(0)) % PALETTE.length;
    // fallback to index if key empty
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster position="top-right" />
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Enrolled Courses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                A colorful, compact view of your courses (no description/dates).
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-400">Active</div>
              <div className="text-lg font-medium text-slate-700">
                {courses.length}
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center shadow text-white">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4">
            {loading ? (
              <div className="flex items-center justify-center h-44 text-slate-500">
                Loading enrolled courses…
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-lg font-medium text-slate-700">
                  No enrolled courses yet
                </div>
                <div className="text-sm text-slate-500 mt-2">
                  Go to Browse to enroll.
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => navigate("/courses")}
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
                  return (
                    <div
                      key={course._id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition"
                      style={{ borderLeft: `6px solid rgba(0,0,0,0.04)` }}
                    >
                      {/* Left: colorful avatar / thumbnail */}
                      <div
                        className="w-36 h-20 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 relative"
                        style={{ background: gradient }}
                      >
                        {course.thumbnail ? (
                          <img
                            src={`${BACKEND_BASE}${course.thumbnail}`}
                            alt={course.name}
                            className="w-full h-full object-cover opacity-90"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-white">
                            <div className="text-lg font-semibold">
                              {initials(course.name)}
                            </div>
                          </div>
                        )}
                        {/* subtle overlay */}
                        <div className="absolute inset-0 bg-black/6" />
                      </div>

                      {/* Center: title + colorful category pill + instructor pill */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {course.name}
                          </h3>

                          {/* colorful category pill */}
                          <span
                            className="px-2 py-0.5 text-xs rounded-full font-medium"
                            style={{
                              background: pickGradient(
                                { category: course.category || course.name },
                                idx
                              ),
                              color: "#fff",
                              boxShadow: "0 4px 14px rgba(12, 12, 12, 0.06)",
                            }}
                          >
                            {course.category || "General"}
                          </span>

                          {/* instructor pill if present */}
                          {course.instructor && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-white border border-slate-100 text-slate-700">
                              {course.instructor}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: stacked actions (Open / Cancel) with colorful buttons */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => navigate(`/courses/${course._id}`)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
                          style={{
                            background: pickGradient(course, idx),
                            boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                          Open
                        </button>

                        <button
                          onClick={() =>
                            openCancelModal(course._id, course.name)
                          }
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-red-600 text-red-600 hover:bg-red-50"
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

      {/* Confirmation modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeCancelModal}
          />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">
              Cancel Enrollment
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Are you sure you want to cancel enrollment for{" "}
              <span className="font-medium text-slate-800">{confirm.name}</span>
              ?
            </p>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={closeCancelModal}
                className="px-3 py-2 rounded bg-slate-100 text-slate-700"
              >
                Close
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
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
