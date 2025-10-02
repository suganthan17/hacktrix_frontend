import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BASE_URL } from "../config";
import { Building, Mail, Lock, Eye, EyeOff } from "lucide-react";

const UniversitySignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.dismiss();

    try {
      const res = await fetch(`${BASE_URL}/api/auth/university-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      toast.success(data.message || "Signup successful", { duration: 2000 });
      navigate("/university-dashboard");
    } catch (err) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* University Name */}
      <div className="relative">
        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          name="name"
          placeholder="University Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-4 pl-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-400 outline-none text-sm"
        />
      </div>

      {/* Email */}
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-4 pl-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-400 outline-none text-sm"
        />
      </div>

      {/* Password */}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type={passwordVisible ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full p-4 pl-12 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-400 outline-none text-sm"
        />
        <button
          type="button"
          onClick={() => setPasswordVisible((v) => !v)}
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
        >
          {passwordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pink-600 text-white p-3 rounded-xl hover:bg-pink-700 transition text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Signing up..." : "Signup"}
      </button>
    </form>
  );
};

export default UniversitySignup;
