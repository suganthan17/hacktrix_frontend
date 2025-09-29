import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashBoard";
import StudentCourses from "./pages/student/StudentCourses";
import CourseDetail from "./pages/student/courseDetail";
import StudentEnrolled from "./pages/student/StudentEnrolled";
import StudentProjects from "./pages/student/StudentProjects";
import StudentCertificates from "./pages/student/StudentCertificates";

// University Pages
import UniversityDashboard from "./pages/university/UniversityDashboard";
import AddCourse from "./pages/university/AddCourse";
import UniversityCourses from "./pages/university/UniversityCourses";
import UniversityStudents from "./pages/university/UniversityStudents";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { fontSize: "16px" },
          action: { text: "✖", onClick: (toast) => toast.dismiss() },
        }}
      />

      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Student Routes */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student-courses" element={<StudentCourses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/student-enrolled" element={<StudentEnrolled />} />
        <Route path="/student-projects" element={<StudentProjects />} />
        <Route path="/student-certificates" element={<StudentCertificates />} />

        {/* University Routes */}
        <Route path="/university-dashboard" element={<UniversityDashboard />} />
        <Route path="/university-courses" element={<UniversityCourses />} />
        <Route path="/university-addcourse" element={<AddCourse />} />
        <Route path="/university-students" element={<UniversityStudents />} />

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
