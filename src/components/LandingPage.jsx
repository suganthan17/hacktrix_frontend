// src/components/LandingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white text-gray-800 font-[Poppins] relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50 to-cyan-50 opacity-70 -z-10"></div>

      {/* Hero Section */}
      <div className="text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500">
          MentorNet
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Bridging the Gap Between Affordable Education and Talent Recognition
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate("/login", { replace: false })}
            className="px-8 py-3 rounded-full text-white text-base font-semibold shadow-lg transition-transform transform hover:-translate-y-1 hover:shadow-xl"
            style={{
              background: "linear-gradient(90deg, #7C3AED, #06B6D4)",
            }}
          >
            Login
          </button>

          <button
            onClick={() => navigate("/signup", { replace: false })}
            className="px-8 py-3 rounded-full text-base font-semibold border border-gray-300 bg-white text-gray-700 shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1"
          >
            Signup
          </button>
        </div>
      </div>

      {/* Banner / Tagline */}
      <div className="mt-16 text-center">
        <p className="text-sm text-gray-500">
          <span className="font-semibold">HackTrix’25</span> · Team{" "}
          <span className="text-blue-600 font-medium">Cosmic Coders</span> ·
          Theme: Digital Infrastructure & Skill Development
        </p>
      </div>

      {/* Soft bottom gradient decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-blue-100 via-cyan-50 to-transparent pointer-events-none"></div>
    </div>
  );
}
