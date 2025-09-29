import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BASE_URL } from "../config";

const UniversitySignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const signupPromise = (async () => {
        const res = await fetch(`${BASE_URL}/api/auth/university-signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        toast.success(data.message, { duration: 3000 });

        setTimeout(() => {
          toast.dismiss();
          navigate("/university-dashboard");
        }, 800);

        return data.message;
      })();

      await toast.promise(signupPromise, {
        loading: "Signing up...",
        success: (msg) => msg,
        error: (err) => err.message || "Signup failed",
      });
    } catch (err) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        type="text"
        name="name"
        placeholder="University Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none"
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
        className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
        className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pink-600 text-white p-4 rounded-xl hover:bg-pink-700 transition cursor-pointer"
      >
        {loading ? "Signing up..." : "Signup"}
      </button>
    </form>
  );
};

export default UniversitySignup;
