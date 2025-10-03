// src/pages/university/UniversityDashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import StudentProgressModal from "../../components/StudentProgressModal";
import toast, { Toaster } from "react-hot-toast";
import { BookOpen, Users, RefreshCw, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const BACKEND_BASE = "http://localhost:5000";
const COLORS = [
  "#06b6d4",
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

/** safeFetchJson - resilient fetch helper */
async function safeFetchJson(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });

  let txt = "";
  try {
    txt = await res.text();
  } catch (err) {
    console.debug("safeFetchJson: failed to read response text", err);
    txt = "";
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (ct.includes("application/json") && txt) {
      try {
        const parsed = JSON.parse(txt);
        msg = parsed?.message || parsed?.error || msg;
      } catch (err) {
        console.debug("safeFetchJson: failed to parse error JSON", err);
      }
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  if (ct.includes("application/json")) {
    try {
      return txt ? JSON.parse(txt) : null;
    } catch (err) {
      console.debug(
        "safeFetchJson: JSON parse failed for successful response",
        err
      );
      return null;
    }
  }

  return null;
}

export default function UniversityDashboard() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrollmentsByCourse, setEnrollmentsByCourse] = useState({});
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCourses = useCallback(async () => {
    const data = await safeFetchJson(`${BACKEND_BASE}/api/courses/university`, {
      method: "GET",
    });
    return Array.isArray(data) ? data : [];
  }, []);

  const fetchEnrollmentsForCourse = async (courseId) => {
    const data = await safeFetchJson(
      `${BACKEND_BASE}/api/enrollments/${encodeURIComponent(courseId)}`,
      { method: "GET" }
    );
    return Array.isArray(data) ? data : [];
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const courseArr = await fetchCourses();
      setCourses(courseArr);

      const enrollMap = {};
      const recent = [];

      const promises = courseArr.map((c) => fetchEnrollmentsForCourse(c._id));
      const settled = await Promise.allSettled(promises);

      for (let i = 0; i < courseArr.length; i++) {
        const c = courseArr[i];
        if (settled[i].status === "fulfilled") {
          const ens = Array.isArray(settled[i].value) ? settled[i].value : [];
          enrollMap[c._id] = ens;
          for (const e of ens) {
            recent.push({
              course: c,
              enrollment: e,
              ts: e.enrolledAt ? new Date(e.enrolledAt).getTime() : 0,
            });
          }
        } else {
          enrollMap[c._id] = [];
          console.debug(
            `loadDashboard: failed to fetch enrollments for course ${c._id}`,
            settled[i].reason
          );
        }
      }

      recent.sort((a, b) => b.ts - a.ts);
      setRecentEnrollments(recent.slice(0, 12)); // keep all fetched, we'll display top 3
      setEnrollmentsByCourse(enrollMap);
    } catch (err) {
      toast.error(err?.message || "Failed to load dashboard");
      console.error("loadDashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalCourses = courses.length;
  const totalStudents = Object.values(enrollmentsByCourse).reduce(
    (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  const studentsPerCourseData = useMemo(() => {
    return courses
      .map((c) => ({
        name: c.name || (c._id ? c._id.slice(-6) : "n/a"),
        count: (enrollmentsByCourse[c._id] || []).length,
        id: c._id,
      }))
      .sort((a, b) => b.count - a.count);
  }, [courses, enrollmentsByCourse]);

  // Use the same model as "Top Distribution": donut chart data
  const donutData = useMemo(
    () =>
      studentsPerCourseData
        .slice(0, 8)
        .map((c) => ({ name: c.name, value: c.count })),
    [studentsPerCourseData]
  );

  const openStudentProgress = (payload) => {
    let studentObj = null;
    if (payload?.enrollment) {
      const e = payload.enrollment;
      studentObj = e.student || e.studentId || (e._id ? { _id: e._id } : null);
    }
    if (!studentObj) return toast.error("Student information missing");
    setSelectedStudent(studentObj);
    setModalOpen(true);
  };

  // small helper for avatar initials
  const initials = (name) => {
    if (!name) return "NA";
    const parts = String(name).split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <UniversitySidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster position="top-right" />
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                University Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Overview of courses and registrations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadDashboard}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm hover:shadow-md border border-gray-100"
                title="Refresh dashboard"
              >
                <RefreshCw className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-slate-700">Refresh</span>
              </button>
            </div>
          </div>

          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="rounded-2xl p-5 shadow-md bg-white/70 backdrop-blur-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white text-indigo-600 shadow-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-indigo-700/60">Total Courses</div>
                <div className="text-2xl font-bold text-slate-900">
                  {loading ? "—" : totalCourses}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5 shadow-md bg-white/70 backdrop-blur-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white text-emerald-600 shadow-sm">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-emerald-700/60">
                  Total Students
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {loading ? "—" : totalStudents}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5 shadow-md bg-white/70 backdrop-blur-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white text-slate-600 shadow-sm">
                <span className="h-6 w-6 inline-block" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Latest Activity</div>
                <div className="text-lg font-medium text-slate-900">
                  {recentEnrollments.length} recent
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Most recent registrations shown below
                </div>
              </div>
            </div>
          </div>

          {/* SINGLE DONUT (students per course) - replaces previous area and pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <section className="lg:col-span-2 bg-white rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Course Registrations
                </h2>
                <div className="text-xs text-slate-500">
                  {studentsPerCourseData.length} courses
                </div>
              </div>

              <div className="h-80 flex items-center justify-center">
                {loading ? (
                  <div className="text-slate-400">Loading chart...</div>
                ) : donutData.length === 0 ? (
                  <div className="text-slate-400">No registrations yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      {/* Create a gradient <defs> for each slice */}
                      <defs>
                        {donutData.map((d, i) => {
                          const base = COLORS[i % COLORS.length];
                          // derive a lighter variant for the gradient end by reducing opacity & mixing white
                          const light = `${base}80`; // simple approach: add alpha; acceptable in most browsers
                          return (
                            <linearGradient
                              id={`grad-${i}`}
                              key={`grad-${i}`}
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={base}
                                stopOpacity={0.95}
                              />
                              <stop
                                offset="100%"
                                stopColor={light}
                                stopOpacity={0.35}
                              />
                            </linearGradient>
                          );
                        })}
                      </defs>

                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={4}
                        label={({ name, percent }) =>
                          `${
                            name.length > 18 ? name.slice(0, 18) + "…" : name
                          } (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {donutData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#grad-${index})`}
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {donutData.map((d, i) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-3 p-2 rounded border border-gray-100"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <div className="text-sm text-slate-700 truncate">
                      {d.name}
                    </div>
                    <div className="ml-auto text-sm font-semibold text-slate-900">
                      {d.value}
                    </div>
                  </div>
                ))}
                {donutData.length === 0 && (
                  <div className="col-span-2 text-center text-slate-400 py-6">
                    No data to show
                  </div>
                )}
              </div>
            </section>

            {/* Right column: quick list of top courses (textual) */}
            <section className="bg-white rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Top Courses
                </h2>
                <div className="text-xs text-slate-500">
                  {studentsPerCourseData.length} total
                </div>
              </div>

              <ul className="divide-y divide-slate-100">
                {studentsPerCourseData.slice(0, 8).map((c, idx) => (
                  <li
                    key={c.id || c.name}
                    className="py-3 flex items-center gap-3"
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    >
                      {String(idx + 1)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {c.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        ID: {String(c.id || "").slice(-8)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {c.count}
                    </div>
                  </li>
                ))}
                {studentsPerCourseData.length === 0 && (
                  <li className="py-6 text-center text-slate-400">
                    No course registrations yet
                  </li>
                )}
              </ul>
            </section>
          </div>

          {/* Recent enrollments - timeline style (limit to 3) */}
          <div className="mt-6 bg-white rounded-2xl p-5 shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Recent Enrollments
              </h3>
              <div className="text-xs text-slate-500">
                {Math.min(recentEnrollments.length, 3)} shown
              </div>
            </div>

            {recentEnrollments.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                No recent enrollments
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* timeline container */}
                <div className="relative ml-6">
                  {/* vertical line */}
                  <div className="absolute left-1.5 top-5 bottom-0 w-0.5 bg-slate-200" />

                  {recentEnrollments.slice(0, 3).map((r, idx) => {
                    const e = r.enrollment;
                    const s = e.student || e.studentId || {};
                    const course = r.course || {};
                    return (
                      <div
                        key={idx}
                        className="relative flex items-start gap-4 p-4 rounded-lg border border-gray-100 bg-white hover:shadow-md transition"
                        style={{ marginLeft: "-1.5rem" }} // pull card left so avatar aligns with line
                      >
                        {/* avatar / marker */}
                        <div className="z-10 flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold shadow-sm">
                            {initials(s.name || s.email || "ST")}
                          </div>
                        </div>

                        {/* card content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-slate-900 truncate">
                                  {s.name ||
                                    s.email ||
                                    String(s._id || "").slice(-8)}
                                </div>
                                <div className="text-xs text-slate-400">•</div>
                                <div className="text-xs text-slate-400">
                                  {e.enrolledAt
                                    ? new Date(
                                        e.enrolledAt
                                      ).toLocaleDateString()
                                    : "-"}
                                </div>
                              </div>

                              <div className="text-xs text-slate-500 mt-1 truncate">
                                {s.email || "-"}
                              </div>

                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                                  {course.name
                                    ? course.name.length > 26
                                      ? course.name.slice(0, 23) + "…"
                                      : course.name
                                    : "Course"}
                                </span>

                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    (e.status || "enrolled").toLowerCase() ===
                                    "enrolled"
                                      ? "bg-indigo-50 text-indigo-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {e.status || "enrolled"}
                                </span>
                              </div>
                            </div>

                            {/* actions */}
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <button
                                onClick={() =>
                                  openStudentProgress({ enrollment: e })
                                }
                                className="inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
                                title="View progress"
                              >
                                View
                                <ArrowRight className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() =>
                                  toast.info("Messaging not yet implemented")
                                }
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-100 bg-white text-slate-600 hover:bg-slate-50"
                                title="Message student"
                              >
                                {/* simple 3-dot icon */}
                                <svg
                                  width="14"
                                  height="4"
                                  viewBox="0 0 14 4"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <circle
                                    cx="2"
                                    cy="2"
                                    r="2"
                                    fill="currentColor"
                                  />
                                  <circle
                                    cx="7"
                                    cy="2"
                                    r="2"
                                    fill="currentColor"
                                  />
                                  <circle
                                    cx="12"
                                    cy="2"
                                    r="2"
                                    fill="currentColor"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* footer row with CTA */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => {
                      // if you have a students page, navigate there instead
                      toast(
                        "Showing all recent enrollments in the dashboard (open full list)."
                      );
                      // optional: loadDashboard(); // uncomment if you prefer refresh action
                    }}
                    className="text-sm text-indigo-600 font-medium hover:underline"
                  >
                    View all enrollments
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {modalOpen && selectedStudent && (
        <StudentProgressModal
          student={selectedStudent}
          studentId={selectedStudent._id || selectedStudent.id}
          courseId={null}
          onClose={() => {
            setModalOpen(false);
            setSelectedStudent(null);
            loadDashboard();
          }}
        />
      )}
    </div>
  );
}
