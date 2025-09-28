import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_BASE_URL;


const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        formData.role === "student"
          ? `${BASE_URL}/api/auth/student/signup`
          : `${BASE_URL}/api/auth/university/signup`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message, { duration: 3000 });
      navigate("/");
    } catch (err) {
      toast.error(err.message, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 font-sans">
      <Toaster position="top-center" />
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">
          Welcome to MentorNet!
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Sign up to start your learning journey
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            required
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
          >
            <option value="student">Student</option>
            <option value="university">University</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 transition"
          >
            {loading ? "Signing up..." : "Signup"}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <span
            className="text-pink-600 font-semibold cursor-pointer"
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
