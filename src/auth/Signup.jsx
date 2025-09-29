import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSignup from "./StudentSignup.jsx";
import UniversitySignup from "./UniversitySignup.jsx";

const Signup = () => {
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-2xl rounded-3xl w-full max-w-lg p-8 sm:p-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to MentorNet!</h1>
          <p className="text-gray-500 mt-2">
            {role === "student" ? "Create your student account to start learning." : "Create your university account to share your courses."}
          </p>
        </div>

        <div className="flex justify-center mb-8 space-x-4">
          <button
            className={`px-6 py-2 rounded-full font-medium ${role === "student" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
            onClick={() => setRole("student")}
          >
            Student
          </button>
          <button
            className={`px-6 py-2 rounded-full font-medium ${role === "university" ? "bg-pink-600 text-white" : "bg-gray-100"}`}
            onClick={() => setRole("university")}
          >
            University
          </button>
        </div>

        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-6">
          {role === "student" ? "Student Signup" : "University Signup"}
        </h1>

        {role === "student" ? <StudentSignup /> : <UniversitySignup />}

        <p className="text-center text-gray-500 mt-6">
          Already have an account?{" "}
          <span className="text-indigo-600 font-semibold cursor-pointer" onClick={() => navigate("/")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
