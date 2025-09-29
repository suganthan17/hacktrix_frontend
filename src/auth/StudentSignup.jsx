import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { BASE_URL } from "../config";

const StudentSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/student-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      toast.success(data.message || "Signup successful", { duration: 2000 });
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Toaster position="top-center" />
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required className="w-full p-4 border rounded-xl" />
      <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" type="email" required className="w-full p-4 border rounded-xl" />
      <input name="password" value={formData.password} onChange={handleChange} placeholder="Password" type="password" required className="w-full p-4 border rounded-xl" />
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl">
        {loading ? "Signing up..." : "Signup"}
      </button>
    </form>
  );
};

export default StudentSignup;
