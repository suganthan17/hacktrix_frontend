import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import StudentDashboard from "./pages/student/StudentDashboard";
import UniversityDashboard from "./pages/university/UniversityDashBoard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/university-dashboard" element={<UniversityDashboard />} />
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
