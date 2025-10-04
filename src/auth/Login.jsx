// src/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const BACKEND_BASE = "http://localhost:5000";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  async function fetchJson(url, opts = {}) {
    const res = await fetch(url, { credentials: "include", ...opts });
    const text = await res.text().catch(() => "");
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { ok: res.ok, status: res.status, body };
  }

  const decideAndNavigate = async () => {
    // Get server-side session user
    const me = await fetchJson(`${BACKEND_BASE}/api/auth/me`, {
      method: "GET",
    });
    if (!me.ok) {
      // fallback: go to root
      navigate("/");
      return;
    }
    const user = me.body || me.body?.user || {};
    const role = user?.role || (user?.user && user.user.role) || null;

    if (role === "student") {
      // ask student profile
      const prof = await fetchJson(`${BACKEND_BASE}/api/student-profile/`, {
        method: "GET",
      });

      if (prof.status === 401) {
        // not logged in as student (unlikely right after login) -> go to login
        navigate("/");
        return;
      }

      if (prof.status === 403) {
        navigate("/student-profile");
        return;
      }

      if (!prof.ok) {
        // fallback attempt: redirect to profile page so they can fix it
        navigate("/student-profile");
        return;
      }

      // prof.body may be {} or profile object
      const profile = prof.body?.profile || prof.body || {};
      const required = ["name", "email", "phone", "school", "grade"];
      const complete = required.every((k) => !!profile[k]);

      if (!complete) {
        navigate("/student-profile");
        return;
      }

      // completed
      navigate("/student-dashboard");
      return;
    }

    if (role === "university") {
      // ask university profile
      const prof = await fetchJson(`${BACKEND_BASE}/api/university-profile/`, {
        method: "GET",
      });

      if (prof.status === 401) {
        navigate("/");
        return;
      }

      if (prof.status === 403) {
        navigate("/university-profile");
        return;
      }

      if (!prof.ok) {
        // fallback: send to profile page
        navigate("/university-profile");
        return;
      }

      const profile = prof.body?.profile || prof.body || {};
      // Define required fields for a university basic info (adjust if needed)
      const requiredUni = ["name", "email", "phone"];
      const completeUni = requiredUni.every((k) => !!profile[k]);

      if (!completeUni) {
        navigate("/university-profile");
        return;
      }

      navigate("/university-dashboard");
      return;
    }

    // default fallback
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.dismiss();

    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
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

      toast.success(data.message || "Logged in");

      // decide where to send user (checks server for profile completeness)
      await decideAndNavigate();
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome Back!
          </h1>
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
              onClick={() => setPasswordVisible((v) => !v)}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {passwordVisible ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
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
