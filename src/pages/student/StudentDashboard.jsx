import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import DashboardHeader from "../../components/DashboardHeader";
import StatsCard from "../../components/StatsCard";
import QuizCard from "../../components/Quizcard.jsx";
import ProgressChart from "../../components/ProgressChart";
import RecentCourses from "../../components/RecentCourses";
import { apiGetCoursesWithUniversity } from "../../utils/api.js";
import { apiGet } from "../../utils/api.js";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    async function loadDashboard() {
      try {
        // Replace the section that fetches profRaw and determines profileObj/studentId
let profRaw = null;
try {
  profRaw = await apiGet("/students/me");
} catch (err) {
  console.warn("/students/me failed:", err && err.message ? err.message : err);
}

if (!mounted) return;

if (!profRaw) {
  setError("Not authenticated. Please login.");
  setLoading(false);
  return;
}

// Normalization: try to support multiple shapes returned by backend
let profileObj = null;
let studentId = null;

// Case A: server returned { profileExists: false, student: {...} }
if (profRaw.profileExists === false && profRaw.student) {
  profileObj = {
    _id: profRaw.student._id || profRaw.student.id || null,
    name: profRaw.student.name || "",
    email: profRaw.student.email || "",
  };
  studentId = profileObj._id;
}
// Case B: server returned { profile: {...} }
else if (profRaw.profile) {
  profileObj = profRaw.profile;
  // if profile object stored student reference, prefer that for id
  studentId = profileObj._id || profileObj.student || profRaw._id || profRaw.id || null;
}
// Case C: server returned the minimal user object: { _id, id, name, email, role }
else if (profRaw._id || profRaw.id || profRaw.email || profRaw.name) {
  profileObj = {
    _id: profRaw._id || profRaw.id || null,
    name: profRaw.name || (profRaw.student && profRaw.student.name) || "",
    email: profRaw.email || (profRaw.student && profRaw.student.email) || "",
  };
  studentId = profileObj._id;
} else {
  // unknown shape: treat as not authenticated
  setError("Not authenticated or profile missing. Please login.");
  setLoading(false);
  return;
}

setProfile(profileObj);


        async function tryMeThenId(meFn, idFn) {
          try {
            return await meFn();
          } catch (err) {
            if (idFn) return await idFn();
            throw err;
          }
        }

        const [summaryRes, coursesRes, quizzesRes, projectsRes] = await Promise.all([
          tryMeThenId(
            () => apiGet("/students/me/summary"),
            studentId ? () => apiGet(`/students/${studentId}/summary`) : null
          ).catch(() => null),

          tryMeThenId(
            () => apiGetCoursesWithUniversity("/students/me/courses"),
            studentId ? () => apiGetCoursesWithUniversity(`/students/${studentId}/courses`) : null
          ).catch(() => []),

          tryMeThenId(
            () => apiGet("/students/me/quizzes"),
            studentId ? () => apiGet(`/students/${studentId}/quizzes`) : null
          ).catch(() => []),

          tryMeThenId(
            () => apiGet("/students/me/projects"),
            studentId ? () => apiGet(`/students/${studentId}/projects`) : null
          ).catch(() => []),
        ]);

        if (!mounted) return;

        if (summaryRes) setSummary(summaryRes);
        if (Array.isArray(coursesRes)) setCourses(coursesRes);
        if (Array.isArray(quizzesRes)) setQuizzes(quizzesRes);
        if (Array.isArray(projectsRes)) setProjects(projectsRes);
      } catch (err) {
        console.error("loadDashboard error:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 p-6">
          <p className="text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 p-6">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  const meaningfulCourses = Array.isArray(courses)
    ? courses.filter((c) => c && (typeof c.name === "string" ? c.name.trim().length > 0 : true) && ["enrolled", "active"].includes(String(c.status || "").toLowerCase()))
    : [];

  const coursesCount = summary?.coursesEnrolled ?? meaningfulCourses.length ?? (Array.isArray(courses) ? courses.length : 0);
  const projectsCount = Array.isArray(projects) ? projects.length : 0;
  const quizAverage = summary?.quizAverage ?? 0;

  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar />
      <div className="flex-1 p-6 space-y-6">
        <DashboardHeader name={profile?.name || "Student"} email={profile?.email || ""} />

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Welcome back, {profile?.name || "Student"}!
          </h2>
          <p className="text-muted-foreground">Here’s your learning progress overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Courses Enrolled" value={coursesCount} />
          <StatsCard title="Projects" value={projectsCount} />
          <StatsCard title="Quiz Average" value={`${quizAverage}%`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {summary?.chartData ? <ProgressChart data={summary.chartData} /> : <div className="card p-6"><p className="text-muted-foreground">No activity chart available.</p></div>}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Quizzes</h3>
            {quizzes.length === 0 ? <p className="text-muted-foreground">No quizzes available.</p> : quizzes.map((quiz) => <QuizCard key={quiz._id || quiz.id} quiz={quiz} />)}
          </div>
        </div>

        <div>
          <RecentCourses
            courses={courses}
            onOpenCourse={(id) => navigate(`/courses/${id}`)}
          />
          {meaningfulCourses.length > 3 && (
            <div className="mt-4">
              <button onClick={() => navigate("/student-enrolled")} className="px-4 py-2 rounded bg-primary text-white">View All Courses</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
