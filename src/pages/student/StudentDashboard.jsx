import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BACKEND_BASE =
  import.meta.env.VITE_BACKEND_BASE || "http://localhost:5000";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function StudentDashboard({ studentId: propStudentId }) {
  const params = useParams();
  const [studentId, setStudentId] = useState(
    propStudentId || params?.studentId || null
  );

  // courses: [{ courseId, title?, progress? }]
  const [courses, setCourses] = useState([]);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);

  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState([]);

  // Helpers
  const pushDebug = (msg, obj) => setDebug((d) => [...d, { msg, obj }]);

  const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const clampPercent = (v) => {
    const n = safeNumber(v, 0);
    return Math.max(0, Math.min(100, n));
  };

  // Auto-detect studentId
  useEffect(() => {
    if (studentId) return;
    // 1) localStorage
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        const id = parsed?.id || parsed?._id || null;
        if (id) {
          setStudentId(id);
          pushDebug("studentId from localStorage", id);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to parse localStorage user", e);
      /* ignore */
    }

    // 2) /api/auth/me fallback
    (async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) {
          pushDebug("/api/auth/me returned non-ok", { status: res.status });
          return;
        }
        const data = await res.json();
        const id = data?.id || data?._id || null;
        if (id) {
          setStudentId(id);
          pushDebug("studentId from /api/auth/me", id);
        }
      } catch (err) {
        pushDebug("/api/auth/me failed", err?.message || String(err));
      }
    })();
  }, [studentId]);

  // Discover courses once we have studentId
  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;

    const candidateCourseEndpoints = [
      // common RESTy shapes
      `${BACKEND_BASE}/api/students/${studentId}/courses`, // returns list of courses for student
      `${BACKEND_BASE}/api/users/${studentId}/courses`, // alternate
      `${BACKEND_BASE}/api/enrollments/${studentId}`, // maybe returns enrollments with course ids
      `${BACKEND_BASE}/api/courses?studentId=${studentId}`, // query param style
      // fallback: maybe /api/courses/enrolled/${studentId}
      `${BACKEND_BASE}/api/courses/enrolled/${studentId}`,
    ];

    const discover = async () => {
      setLoadingDiscovery(true);
      setError(null);
      setCourses([]);
      pushDebug("start course discovery", { candidateCourseEndpoints });
      try {
        let discovered = null;
        for (const url of candidateCourseEndpoints) {
          try {
            const res = await fetch(url, { credentials: "include" });
            // don't treat 404/500 as fatal: try next
            if (!res.ok) {
              pushDebug("discovery endpoint not ok", {
                url,
                status: res.status,
              });
              continue;
            }
            const data = await res.json();
            // Heuristics: if data is an array of courses or enrollments -> map to courseId
            if (Array.isArray(data) && data.length > 0) {
              // find course id fields in array elements
              const mapped = data
                .map((item) => {
                  return {
                    courseId:
                      item.courseId ??
                      item._id ??
                      item.id ??
                      item.course?._id ??
                      null,
                    title:
                      item.title ??
                      item.name ??
                      (item.course &&
                        (item.course.title || item.course.name)) ??
                      null,
                    raw: item,
                  };
                })
                .filter((c) => c.courseId);
              if (mapped.length) {
                discovered = mapped;
                pushDebug("discovered courses via array endpoint", {
                  url,
                  mappedSample: mapped.slice(0, 3),
                });
                break;
              }
            } else if (data && typeof data === "object") {
              // maybe object with `courses` or `enrolledCourses`
              const list =
                data.courses ||
                data.enrolledCourses ||
                data.data ||
                data.items ||
                null;
              if (Array.isArray(list) && list.length) {
                const mapped = list
                  .map((item) => ({
                    courseId:
                      item.courseId ??
                      item._id ??
                      item.id ??
                      item.course?._id ??
                      null,
                    title:
                      item.title ??
                      item.name ??
                      (item.course &&
                        (item.course.title || item.course.name)) ??
                      null,
                    raw: item,
                  }))
                  .filter((c) => c.courseId);
                if (mapped.length) {
                  discovered = mapped;
                  pushDebug(
                    "discovered courses via object container endpoint",
                    { url, mappedSample: mapped.slice(0, 3) }
                  );
                  break;
                }
              }
              // sometimes endpoint returns a single course object
              const possibleId = data.courseId ?? data._id ?? data.id;
              if (possibleId) {
                discovered = [
                  {
                    courseId: possibleId,
                    title: data.title ?? null,
                    raw: data,
                  },
                ];
                pushDebug("discovered single course object", {
                  url,
                  courseId: possibleId,
                });
                break;
              }
            }
          } catch (err) {
            pushDebug("discovery fetch error", {
              url,
              err: err?.message ?? String(err),
            });
            continue;
          }
        }

        // If we still didn't discover anything, try a last-resort pattern: maybe progress endpoint returns all courses
        if (!discovered) {
          const tryProgressAll = `${BACKEND_BASE}/api/progress/${studentId}`; // maybe returns array of progress per course
          try {
            const res2 = await fetch(tryProgressAll, {
              credentials: "include",
            });
            if (res2.ok) {
              const d2 = await res2.json();
              if (Array.isArray(d2) && d2.length) {
                const mapped = d2
                  .map((item) => ({
                    courseId:
                      item.courseId ?? item._id ?? item.id ?? item.courseId,
                    title: item.title ?? item.courseTitle ?? null,
                    progress: item,
                  }))
                  .filter((c) => c.courseId);
                if (mapped.length) {
                  discovered = mapped;
                  pushDebug(
                    "discovered courses via /api/progress/:studentId (array)",
                    { mappedSample: mapped.slice(0, 3) }
                  );
                }
              }
            } else {
              pushDebug("tryProgressAll not ok", {
                url: tryProgressAll,
                status: res2.status,
              });
            }
          } catch (err) {
            pushDebug("tryProgressAll error", {
              err: err?.message ?? String(err),
            });
          }
        }

        if (cancelled) return;

        if (!discovered) {
          setError(
            "Could not discover enrolled courses automatically. (No matching endpoints returned data.)"
          );
          pushDebug("discovery failed - no courses", null);
          setCourses([]);
          return;
        }

        // Deduplicate by courseId
        const unique = [];
        const seen = new Set();
        for (const c of discovered) {
          if (!c.courseId) continue;
          if (seen.has(String(c.courseId))) continue;
          seen.add(String(c.courseId));
          unique.push({
            courseId: String(c.courseId),
            title: c.title || `Course ${unique.length + 1}`,
            progress: c.progress ?? null,
          });
        }
        setCourses(unique);
        setSelectedCourseIndex(0);
      } catch (err) {
        setError("Course discovery failed: " + (err?.message || String(err)));
        pushDebug("discovery exception", err?.message ?? String(err));
      } finally {
        setLoadingDiscovery(false);
      }
    };

    discover();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  // Fetch progress for discovered courses (if progress is not already present)
  useEffect(() => {
    if (!studentId || !courses || courses.length === 0) return;
    let cancelled = false;

    const fetchAllProgress = async () => {
      setLoadingProgress(true);
      pushDebug("start fetching progress for courses", { courses });

      const newCourses = [...courses];

      for (let i = 0; i < newCourses.length; i++) {
        const c = newCourses[i];
        if (c.progress) continue; // already have progress attached (discovered from earlier endpoint)
        // We'll try multiple strategies to fetch progress for a single course:
        const candidate = [
          `${BACKEND_BASE}/api/progress/${studentId}/${c.courseId}`, // prefer structured endpoint
          `${BACKEND_BASE}/api/courses/${c.courseId}/progress/${studentId}`, // alt shape
          `${BACKEND_BASE}/api/courses/${c.courseId}/progress`, // maybe course-scoped
          `${BACKEND_BASE}/api/progress?studentId=${studentId}&courseId=${c.courseId}`, // query params
        ];

        let got = null;
        for (const url of candidate) {
          try {
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) {
              pushDebug("per-course-progress endpoint not ok", {
                url,
                status: res.status,
                courseId: c.courseId,
              });
              continue;
            }
            const data = await res.json();
            // Accept either an object or array with a matching courseId
            if (data && typeof data === "object") {
              // normalize data into expected shape if possible; keep raw available
              got = {
                raw: data,
                overallCompletion:
                  data.overallCompletion ??
                  data.completion ??
                  data.percent ??
                  null,
                videosWatched:
                  data.videosWatched ?? data.videos ?? data.watchProgress ?? [],
                quizzes: data.quizzes ?? data.quizProgress ?? [],
                projects: data.projects ?? data.projectProgress ?? [],
              };
              pushDebug("got progress", { url, courseId: c.courseId });
              break;
            }
          } catch (err) {
            pushDebug("per-course-progress fetch error", {
              url,
              err: err?.message ?? String(err),
            });
            continue;
          }
        }

        // If not found, try a global progress endpoint that returns array items and pick item with courseId
        if (!got) {
          try {
            const allProgUrl = `${BACKEND_BASE}/api/progress/${studentId}`; // maybe returns array
            const res2 = await fetch(allProgUrl, { credentials: "include" });
            if (res2.ok) {
              const arr = await res2.json();
              if (Array.isArray(arr)) {
                const found = arr.find(
                  (it) =>
                    String(it.courseId ?? it._id ?? it.id) ===
                    String(c.courseId)
                );
                if (found) {
                  got = {
                    raw: found,
                    overallCompletion:
                      found.overallCompletion ?? found.completion ?? null,
                    videosWatched: found.videosWatched ?? found.videos ?? [],
                    quizzes: found.quizzes ?? found.quizProgress ?? [],
                    projects: found.projects ?? found.projectProgress ?? [],
                  };
                  pushDebug("found progress in global progress array", {
                    allProgUrl,
                    courseId: c.courseId,
                  });
                }
              }
            }
          } catch (err) {
            pushDebug("global progress fetch error", {
              err: err?.message ?? String(err),
            });
          }
        }

        // Attach either progress or null
        newCourses[i] = { ...newCourses[i], progress: got };
        if (cancelled) return;
      }

      // update state
      if (!cancelled) {
        setCourses(newCourses);
      }
      setLoadingProgress(false);
    };

    fetchAllProgress();

    return () => {
      cancelled = true;
    };
  }, [studentId, courses.length]); // re-run if course list changes

  // UI helpers to build chart data safely from progress
  const buildChartData = (progressObj) => {
    if (!progressObj)
      return {
        pie: [
          { name: "Completed", value: 0 },
          { name: "Remaining", value: 100 },
        ],
        videos: [],
        quizzes: [],
        projects: [],
      };

    const overall = clampPercent(
      progressObj.overallCompletion ?? progressObj.completion ?? 0
    );

    const pie = [
      { name: "Completed", value: overall },
      { name: "Remaining", value: Math.max(0, 100 - overall) },
    ];

    const videos = Array.isArray(progressObj.videosWatched)
      ? progressObj.videosWatched.map((v) => ({
          name: String(v.videoId ?? v.id ?? v.name ?? "video"),
          value: clampPercent(v.watchedPercent ?? v.percent ?? v.value ?? 0),
        }))
      : [];

    const quizzes = Array.isArray(progressObj.quizzes)
      ? progressObj.quizzes.map((q) => ({
          name: String(q.quizId ?? q.id ?? q.name ?? "quiz"),
          value: safeNumber(q.score ?? q.percent ?? 0),
        }))
      : [];

    const projects = Array.isArray(progressObj.projects)
      ? progressObj.projects.map((p) => {
          const submitted = Boolean(p.submitted);
          const val = submitted
            ? p.score != null
              ? safeNumber(p.score, 0)
              : 100
            : 0;
          return {
            name: String(p.projectId ?? p.id ?? p.name ?? "project"),
            value: val,
          };
        })
      : [];

    return { pie, videos, quizzes, projects };
  };

  // UI render
  const selectedCourse = courses[selectedCourseIndex] ?? null;
  const selectedProgress = selectedCourse?.progress ?? null;
  const { pie, videos, quizzes, projects } = buildChartData(
    selectedProgress?.raw
      ? selectedProgress
      : selectedProgress ?? { overallCompletion: 0 }
  );

  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <div className="p-6 w-full">
        <h2 className="text-2xl font-bold mb-4">Course Progress Dashboard</h2>

        {/* Loading / discovery state */}
        {!studentId ? (
          <div className="p-6 bg-white rounded shadow-sm">
            Auto-detecting student... (looks at props → localStorage →
            /api/auth/me)
          </div>
        ) : loadingDiscovery ? (
          <div className="p-6 bg-white rounded shadow-sm">
            Discovering your courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="p-6 bg-white rounded shadow-sm">
            <div className="mb-2 text-red-600">
              No enrolled courses discovered automatically.
            </div>
            <div className="text-sm text-gray-700">
              Check backend endpoints or place a `user` object in localStorage
              for dev:
            </div>
            <pre className="bg-gray-100 p-2 mt-2 text-xs">
              {
                'localStorage.setItem("user", JSON.stringify({ id: "STUDENT_ID_HERE" }))'
              }
            </pre>
            {error && <div className="mt-3 text-red-600">Error: {error}</div>}
            <div className="mt-4 text-xs text-gray-500">
              Debug: {debug.length} messages — open dev panel below to inspect.
            </div>
          </div>
        ) : (
          <>
            {/* Course tabs */}
            <div className="mb-4 flex gap-2 items-center">
              {courses.map((c, idx) => (
                <button
                  key={c.courseId}
                  onClick={() => setSelectedCourseIndex(idx)}
                  className={`px-3 py-1 rounded ${
                    idx === selectedCourseIndex
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {c.title ?? c.courseId}
                </button>
              ))}
              {loadingProgress && (
                <div className="ml-4 text-sm text-gray-600">
                  loading course progress...
                </div>
              )}
            </div>

            {/* Dashboard for selected course */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">
                Overall Completion —{" "}
                {selectedCourse?.title ?? selectedCourse?.courseId}
              </h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pie}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {pie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Video Progress (%)</h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={videos}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Quiz Scores</h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quizzes}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Project Progress</h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projects}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Dev debug panel */}
        <details className="mt-6 bg-gray-50 p-3 rounded text-xs">
          <summary className="cursor-pointer">
            Debug / Diagnostics ({debug.length} items)
          </summary>
          <div className="mt-2">
            <strong>studentId:</strong> {String(studentId || "")}
            <pre className="whitespace-pre-wrap mt-2 text-xs">
              {JSON.stringify({ courses }, null, 2)}
            </pre>
            <div className="mt-2">
              <strong>debug log:</strong>
              <ul className="list-disc ml-5">
                {debug.map((d, i) => (
                  <li key={i}>
                    <div className="font-medium">{d.msg}</div>
                    <pre className="text-xs">
                      {JSON.stringify(d.obj, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
