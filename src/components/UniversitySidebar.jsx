import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  PlusCircle,
  LogOut,
  GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "../config";

const UniversitySidebar = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setEmail(data.email);
      } catch (err) {
        if (err.message === "Not logged in") navigate("/");
      }
    };
    fetchUser();
  }, [navigate]);

  const logoutHandler = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-lg min-h-screen flex flex-col">
      <div
        className="flex flex-col items-center justify-center gap-2 py-6 border-b border-indigo-500 cursor-pointer hover:opacity-90 transition"
        onClick={() => navigate("/university-dashboard")}
      >
        <GraduationCap className="w-7 h-7 text-white" />
        <span className="text-2xl font-bold">MentorNet</span>
        {email && <span className="text-sm text-indigo-200 mt-1">{email}</span>}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link
          to="/university-dashboard"
          className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer text-white hover:bg-white/25"
        >
          <Home className="w-5 h-5" />
          <span className="text-md">Dashboard</span>
        </Link>

        <Link
          to="/university-courses"
          className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer text-white hover:bg-white/25"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-md">Courses</span>
        </Link>

        <Link
          to="/university-addcourse"
          className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer text-white hover:bg-white/25"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-md">Add Course</span>
        </Link>

        <Link
          to="/university-students"
          className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer text-white hover:bg-white/25"
        >
          <Users className="w-5 h-5" />
          <span className="text-md">Students</span>
        </Link>

        <button
          onClick={logoutHandler}
          className="flex items-center gap-3 p-3 mt-6 rounded-lg hover:bg-red-500 transition-all duration-300 text-red-200 font-medium cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default UniversitySidebar;
