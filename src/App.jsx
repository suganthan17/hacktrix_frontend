// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// ✅ correct
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

import RequireProfileComplete from "./components/RequireProfileComplete";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontSize: "16px" },
          action: { text: "✖", onClick: (toast) => toast.dismiss() },
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
            <RequireProfileComplete>
              <StudentDashboard />
            </RequireProfileComplete>
          }
        />
        <Route
          path="/student-courses"
          element={
            <RequireProfileComplete>
              <StudentCourses />
            </RequireProfileComplete>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <RequireProfileComplete>
              <CourseDetail />
            </RequireProfileComplete>
          }
        />
        <Route
          path="/student-enrolled"
          element={
            <RequireProfileComplete>
              <EnrolledCourses />
            </RequireProfileComplete>
          }
        />
        <Route
          path="/student-projects"
          element={
            <RequireProfileComplete>
              <StudentProjects />
            </RequireProfileComplete>
          }
        />
        <Route
          path="/student-certificates"
          element={
            <RequireProfileComplete>
              <StudentCertificates />
            </RequireProfileComplete>
          }
        />
        <Route
          path="/quiz/:quizId"
          element={
            <RequireProfileComplete>
              <TakeQuiz />
            </RequireProfileComplete>
          }
        />

        {/* Profile page must remain accessible so new users can complete it */}
        <Route path="/student-profile" element={<StudentProfile />} />

        {/* University Routes (you can add RequireProfileComplete for universities if desired) */}
        <Route path="/university-dashboard" element={<UniversityDashboard />} />
        <Route path="/university-courses" element={<UniversityCourses />} />
        <Route path="/university-addcourse" element={<AddCourse />} />
        <Route path="/university-students" element={<UniversityStudents />} />
        <Route path="/university-profile" element={<UniversityProfile />} />

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
    </Router>
  );
}

export default App;
