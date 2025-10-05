// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// auth
import Login from "./auth/Login";
import Signup from "./auth/Signup";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import CourseDetail from "./pages/student/courseDetail";
import EnrolledCourses from "./pages/student/EnrolledCourses";
import StudentProjects from "./pages/student/StudentProjects";
import StudentCertificates from "./pages/student/StudentCertificates";
import StudentProfile from "./pages/student/StudentProfile";

// University Pages
import UniversityDashboard from "./pages/university/UniversityDashboard";
import AddCourse from "./pages/university/AddCourse";
import UniversityCourses from "./pages/university/UniversityCourses";
import UniversityStudents from "./pages/university/UniversityStudents";
import UniversityProfile from "./pages/university/UniversityProfile";

// Quiz Page
import TakeQuiz from "./pages/student/takeQuiz";

// Small UX helpers / guards
import RequireProfileComplete from "./components/RequireProfileComplete";
import { Toaster } from "react-hot-toast";

// Project-wide context provider (keeps old change)
import { ProjectsProvider } from "./context/ProjectsContext";

/**
 * Merged App
 * - ProjectsProvider wraps the app so all pages can use ProjectsContext.
 * - RequireProfileComplete protects student/university areas (except the profile pages
 *   which must be accessible so new users can complete them).
 * - Toaster configured centrally.
 *
 * If any import path is different in your repo (case-sensitive), adjust imports accordingly.
 */
function App() {
  return (
    <Router>
      <ProjectsProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: { fontSize: "16px" },
            // `action` API differs between versions of react-hot-toast; this is safe
            action: {
              text: "✖",
              onClick: (t) => t.dismiss?.() || null,
            },
          }}
        />

        <Routes>
          {/* Auth */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Student Routes (protected by profile completion) */}
          <Route
            path="/student-dashboard"
            element={
              <RequireProfileComplete role="student">
                <StudentDashboard />
              </RequireProfileComplete>
            }
          />
          <Route
            path="/student-courses"
            element={
              <RequireProfileComplete role="student">
                <StudentCourses />
              </RequireProfileComplete>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <RequireProfileComplete role="student">
                <CourseDetail />
              </RequireProfileComplete>
            }
          />
          <Route
            path="/student-enrolled"
            element={
              <RequireProfileComplete role="student">
                <EnrolledCourses />
              </RequireProfileComplete>
            }
          />
          <Route
            path="/student-projects"
            element={
              <RequireProfileComplete role="student">
                <StudentProjects />
              </RequireProfileComplete>
            }
          />
          <Route
            path="/student-certificates"
            element={
              <RequireProfileComplete role="student">
                <StudentCertificates />
              </RequireProfileComplete>
            }
          />
          <Route
            path="/quiz/:quizId"
            element={
              <RequireProfileComplete role="student">
                <TakeQuiz />
              </RequireProfileComplete>
            }
          />

          {/* Profile pages remain accessible so new users can complete them */}
          <Route path="/student-profile" element={<StudentProfile />} />
          <Route path="/university-profile" element={<UniversityProfile />} />

          {/* University Routes (protected by profile completion) */}
          <Route
            path="/university-dashboard"
            element={
              <RequireProfileComplete role="university">
                <UniversityDashboard />
              </RequireProfileComplete>
            }
          />
          <Route
            path="/university-courses"
            element={
              <RequireProfileComplete role="university">
                <UniversityCourses />
              </RequireProfileComplete>
            }
          />
          <Route
            path="/university-addcourse"
            element={
              <RequireProfileComplete role="university">
                <AddCourse />
              </RequireProfileComplete>
            }
          />
          <Route
            path="/university-students"
            element={
              <RequireProfileComplete role="university">
                <UniversityStudents />
              </RequireProfileComplete>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="text-center mt-20 text-white text-2xl">
                Page Not Found
              </div>
            }
          />
        </Routes>
      </ProjectsProvider>
    </Router>
  );
}

export default App;
