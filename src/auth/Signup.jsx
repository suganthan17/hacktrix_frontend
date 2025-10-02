import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSignup from "./StudentSignup.jsx";
import UniversitySignup from "./UniversitySignup.jsx";
import { User, Building } from "lucide-react";

const Signup = () => {
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 sm:p-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome to MentorNet!
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {role === "student"
              ? "Create your student account to start learning."
              : "Create your university account to share your courses."}
          </p>
        </div>

        {/* role toggle */}
        <div className="flex items-center justify-center mb-8 gap-4">
          <button
            onClick={() => setRole("student")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-shadow ${
              role === "student"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:shadow-sm"
            }`}
            aria-pressed={role === "student"}
          >
            <User className={`w-4 h-4 ${role === "student" ? "text-white" : "text-slate-500"}`} />
            Student
          </button>

          <button
            onClick={() => setRole("university")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-shadow ${
              role === "university"
                ? "bg-pink-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:shadow-sm"
            }`}
            aria-pressed={role === "university"}
          >
            <Building className={`w-4 h-4 ${role === "university" ? "text-white" : "text-slate-500"}`} />
            University
          </button>
        </div>

        <h2 className="text-lg sm:text-2xl font-semibold text-center text-slate-900 mb-6">
          {role === "student" ? "Student Signup" : "University Signup"}
        </h2>

        <div className="space-y-4">
          {role === "student" ? <StudentSignup /> : <UniversitySignup />}
        </div>

        <p className="text-center text-slate-500 mt-6 text-sm">
          Already have an account?{" "}
          <span
            className="text-indigo-600 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
