import React, { useEffect, useState, useCallback, useMemo } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import StudentProgressModal from "../../components/StudentProgressModal";
import toast, { Toaster } from "react-hot-toast";
import { BookOpen, Users, RefreshCw, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
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

  // read text safely with a minimal log on failure
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

      // fetch enrollments concurrently and handle failures without silent empty catch blocks
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
          // keep a record and log the error for debugging
          enrollMap[c._id] = [];
          console.debug(
            `loadDashboard: failed to fetch enrollments for course ${c._id}`,
            settled[i].reason
          );
        }
      }

      recent.sort((a, b) => b.ts - a.ts);
      setRecentEnrollments(recent.slice(0, 8));
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

  // Prepare wave data: keep top N and add a small smoothing by inserting tiny intermediate points
  const waveData = useMemo(() => {
    const top = studentsPerCourseData.slice(0, 10);
    // If no data, return empty
    if (!top.length) return [];

    // Map into objects with short names (trim if too long)
    const mapped = top.map((d, i) => ({
      idx: i,
      name: d.name.length > 20 ? d.name.slice(0, 18) + "…" : d.name,
      count: d.count,
    }));

    // Optionally add small "spline" points between each pair to make the area appear more flowing
    // Recharts with type="monotone" is already smooth; we keep data as-is for clarity
    return mapped;
  }, [studentsPerCourseData]);

  const pieData = useMemo(
    () =>
      studentsPerCourseData
        .slice(0, 6)
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="rounded-2xl p-5 shadow-md bg-white/60 backdrop-blur-md border border-gray-100 flex items-center gap-4">
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

            <div className="rounded-2xl p-5 shadow-md bg-white/60 backdrop-blur-md border border-gray-100 flex items-center gap-4">
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

            <div className="rounded-2xl p-5 shadow-md bg-white/60 backdrop-blur-md border border-gray-100 flex items-center gap-4">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-white rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Students per Course
                </h2>
                <div className="text-xs text-slate-500">
                  {studentsPerCourseData.length} courses
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- WAVE: AreaChart with smooth curve (monotone) --- */}
                <div className="h-80 rounded-lg p-3 bg-slate-50 border">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={waveData}
                      margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient
                          id="waveGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#6366f1"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="60%"
                            stopColor="#06b6d4"
                            stopOpacity={0.12}
                          />
                          <stop
                            offset="100%"
                            stopColor="#06b6d4"
                            stopOpacity={0.04}
                          />
                        </linearGradient>

                        <linearGradient
                          id="waveStroke"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "count") return [value, "Students"];
                          return [value, name];
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="url(#waveStroke)"
                        strokeWidth={2.5}
                        fill="url(#waveGradient)"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      >
                        {/* show small labels on points */}
                        <LabelList
                          dataKey="count"
                          position="top"
                          formatter={(v) => (v ? String(v) : "")}
                        />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-3 border rounded-lg h-80 overflow-auto bg-white">
                  <div className="text-xs text-slate-500 mb-2">
                    Course registrations (top)
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {studentsPerCourseData.map((c, i) => (
                      <li
                        key={c.id || c.name + i}
                        className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded transition"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-800">
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
                      <li className="py-8 text-center text-slate-400">
                        No course registrations yet
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Distribution (Top courses)
                </h2>
                <div className="text-xs text-slate-500">
                  {pieData.length} slices
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={4}
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-3 border rounded-lg text-sm text-slate-700">
                Total courses:{" "}
                <span className="font-semibold">{totalCourses}</span>
              </div>
            </section>
          </div>

          <div className="mt-6 bg-white rounded-2xl p-5 shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Recent Enrollments
              </h3>
              <div className="text-xs text-slate-500">
                {recentEnrollments.length} shown
              </div>
            </div>

            {recentEnrollments.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                No recent enrollments
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentEnrollments.map((r, idx) => {
                  const e = r.enrollment;
                  const s = e.student || e.studentId || {};
                  return (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg flex items-start justify-between hover:shadow-sm transition bg-white"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {s.name || String(s._id || "").slice(-8)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {s.email || "-"}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {r.course?.name || "Course"} •{" "}
                          {e.enrolledAt
                            ? new Date(e.enrolledAt).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openStudentProgress({ enrollment: e })}
                          className="px-3 py-1 rounded bg-indigo-600 text-white text-sm inline-flex items-center gap-2 hover:bg-indigo-700 transition"
                        >
                          View <ArrowRight className="h-4 w-4" />
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
