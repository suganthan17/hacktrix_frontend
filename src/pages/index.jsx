// src/pages/Index.jsx
import React, { useEffect, useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import StatsCard from "../components/StatsCard";
import CourseCard from "../components/CourseCard";
import QuizCard from "../components/Quizcard";
import ProgressChart from "../components/ProgressChart";
import api from "../utils/api";

/**
 * Helper: try a list of endpoints until one returns 2xx.
 * Returns response.data or throws the last error.
 */
async function tryEndpoints(list) {
  let lastErr = null;
  for (const ep of list) {
    try {
      const res = await api.get(ep);
      if (res && res.status >= 200 && res.status < 300) return res.data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * Normalizes progress data to [{date, value}, ...] for ProgressChart.
 * If backend returns an object of {date: value} or similar, convert accordingly.
 */
function normalizeProgress(raw) {
  if (!raw) return [];
  // if already array of {date, value} assume good
  if (Array.isArray(raw) && raw.length && raw[0].date && raw[0].value !== undefined) {
    return raw;
  }
  // if array of points with different keys (e.g. {week, score})
  if (Array.isArray(raw) && raw.length) {
    return raw.map((r, i) => {
      const date = r.date || r.week || r.label || `P${i + 1}`;
      const value = r.value ?? r.score ?? r.progress ?? 0;
      return { date, value };
    });
  }
  // if object map => convert
  if (typeof raw === "object") {
    return Object.entries(raw).map(([k, v]) => ({ date: k, value: Number(v) || 0 }));
  }
  return [];
}

export default function Index() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setErrMsg("");
      try {
        // 1) Resolve studentId: prefer localStorage, fallback to /api/auth/me or /api/student-profile/me
        let studentId = localStorage.getItem("studentId");
        let profileData = null;

        if (!studentId) {
          // try auth/me
          try {
            const auth = await api.get("/api/auth/me");
            if (auth?.data?.user?._id) {
              studentId = auth.data.user._id;
              profileData = auth.data.user;
              localStorage.setItem("studentId", studentId);
            }
          } catch (e) {
            // ignore, try next
          }
        }

        // 2) Fetch profile if not resolved yet
        if (!profileData) {
          const profileEndpoints = [];
          if (studentId) {
            profileEndpoints.push(`/api/student-profile/${studentId}`, `/api/student-profile/${studentId}/profile`);
          }
          profileEndpoints.push(`/api/student-profile/me`, `/api/auth/me`);
          try {
            const p = await tryEndpoints(profileEndpoints);
            // Accept different shapes
            if (p?.user) profileData = p.user;
            else if (p?.student) profileData = p.student;
            else profileData = p;
            if (!studentId && profileData && profileData._id) {
              studentId = profileData._id;
              localStorage.setItem("studentId", studentId);
            }
          } catch (e) {
            // profile remains null
          }
        }

        // 3) Fetch courses (try a few common routes)
        const courseEndpoints = [];
        if (studentId) {
          courseEndpoints.push(
            `/api/courses/enrolled/${studentId}`,
            `/api/courses/student/${studentId}`,
            `/api/courses?student=${studentId}`
          );
        }
        courseEndpoints.push(`/api/courses`); // fallback: list all courses
        let coursesData = [];
        try {
          coursesData = await tryEndpoints(courseEndpoints);
          // many APIs return { courses: [...] } or array directly
          if (coursesData?.courses) coursesData = coursesData.courses;
        } catch (e) {
          coursesData = [];
        }

        // 4) Fetch progress
        const progressEndpoints = [];
        if (studentId) {
          progressEndpoints.push(`/api/progress/${studentId}`, `/api/progress/student/${studentId}`);
        }
        progressEndpoints.push(`/api/progress`); // fallback
        let progressData = [];
        try {
          progressData = await tryEndpoints(progressEndpoints);
          if (progressData?.progress) progressData = progressData.progress;
        } catch (e) {
          progressData = [];
        }
        progressData = normalizeProgress(progressData);

        // 5) Fetch quizzes
        const quizEndpoints = [];
        if (studentId) {
          quizEndpoints.push(`/api/quizzes/upcoming/${studentId}`, `/api/quizzes/student/${studentId}`);
        }
        quizEndpoints.push(`/api/quizzes`); // fallback
        let quizzesData = [];
        try {
          quizzesData = await tryEndpoints(quizEndpoints);
          if (quizzesData?.quizzes) quizzesData = quizzesData.quizzes;
        } catch (e) {
          quizzesData = [];
        }

        if (!cancelled) {
          setStudent(profileData);
          setCourses(Array.isArray(coursesData) ? coursesData : []);
          setProgress(progressData);
          setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setErrMsg("Failed to load dashboard data. Check backend or CORS.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (errMsg) return <div className="p-8 text-red-600">{errMsg}</div>;

  return (
    <div className="container">
      <DashboardHeader name={student?.name || student?.fullName || student?.username || "Student"} email={student?.email || ""} />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Courses" value={courses.length} delta="" />
        <StatsCard title="Completed" value={courses.filter(c => (c.progress ?? c.completion ?? 0) >= 100).length} />
        <StatsCard title="Quizzes" value={quizzes.length} delta="" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <ProgressChart data={progress} />

          <div>
            <h3 className="text-lg font-semibold mb-3">Your Courses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((c) => (
                <CourseCard key={c._id || c.id || c.name} course={c} />
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Upcoming Quizzes</h3>
            <div className="space-y-3">
              {quizzes.map((q) => (
                <QuizCard key={q._id || q.id || q.title} quiz={q} />
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
