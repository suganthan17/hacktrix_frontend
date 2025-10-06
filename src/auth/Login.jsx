// src/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BASE_URL } from "../config";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const togglePassword = (e) => {
    e?.preventDefault();
    setPasswordVisible((v) => !v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.dismiss();

    const loginPromise = (async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) throw new Error(data.message || "Login failed");
      return data;
    })();

    try {
      const data = await toast.promise(loginPromise, {
        loading: "Logging in...",
        success: (resData) => resData.message || "Logged in successfully",
        error: (err) => err.message || "Login failed",
      });

      const role = data?.user?.role || data?.role || "";
      // navigate to dashboard and replace history so back doesn't return to login
      if (role === "university") navigate("/university-dashboard", { replace: true });
      else navigate("/student-dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Welcome Back!</h1>
          <p className="mt-2 text-sm text-slate-500">Log in to access your MentorNet dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-4 pl-12 pr-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
            />
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="w-5 h-5" />
            </div>

            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-4 pl-12 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
            />

            <button
              type="button"
              onClick={togglePassword}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              title={passwordVisible ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {passwordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6 text-sm">
          Don't have an account?{" "}
          <span
            className="text-indigo-600 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
