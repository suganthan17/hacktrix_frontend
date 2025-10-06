import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSignup from "./StudentSignup";
import UniversitySignup from "./UniversitySignup";
import { User, Building } from "lucide-react";
import toast from "react-hot-toast";

const Signup = () => {
  const [role, setRole] = useState("student");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSuccess = (data = {}) => {
    const userRole = data?.user?.role || data?.role || role;
    toast.success("Signup successful");
    if (userRole === "university")
      navigate("/university-dashboard", { replace: true });
    else navigate("/student-dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div
        className={`w-full max-w-lg rounded-3xl shadow-lg p-10 sm:p-12 transition-all duration-300 ${
          role === "student"
            ? "bg-blue-100 border border-blue-200"
            : "bg-pink-100 border border-pink-200"
        }`}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Welcome to MentorNet!
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {role === "student"
              ? "Create your student account to start learning."
              : "Create your university account to share your courses."}
          </p>
        </div>

        {/* role toggle */}
        <div className="flex items-center justify-center mb-8 gap-4">
          <button
            onClick={() => setRole("student")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              role === "student"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50"
            }`}
          >
            <User
              className={`w-4 h-4 ${
                role === "student" ? "text-white" : "text-blue-600"
              }`}
            />
            Student
          </button>

          <button
            onClick={() => setRole("university")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              role === "university"
                ? "bg-pink-500 text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-pink-50"
            }`}
          >
            <Building
              className={`w-4 h-4 ${
                role === "university" ? "text-white" : "text-pink-600"
              }`}
            />
            University
          </button>
        </div>

        <h2 className="text-lg sm:text-2xl font-semibold text-center text-slate-800 mb-6">
          {role === "student" ? "Student Signup" : "University Signup"}
        </h2>

        <div className="space-y-4">
          {role === "student" ? (
            <StudentSignup
              onSuccess={handleSuccess}
              setSubmitting={setSubmitting}
            />
          ) : (
            <UniversitySignup
              onSuccess={handleSuccess}
              setSubmitting={setSubmitting}
            />
          )}
        </div>

        <p className="text-center text-slate-600 mt-6 text-sm">
          Already have an account?{" "}
          <span
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
