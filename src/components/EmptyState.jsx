// src/components/EmptyState.jsx
import React from "react";
import Button from "./Button";

export default function EmptyState({ onAdd }) {
  return (
    <div className="relative text-center p-12 bg-[var(--card-bg)] rounded-lg shadow-md overflow-hidden">
      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(139,92,246,0.2))", filter: "blur(24px)" }} />
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-2">No projects yet</h3>
        <p className="text-gray-600 mb-6">Start by adding your first project or import from GitHub</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={onAdd} className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--accent-color)] text-white min-w-[140px]">Add Your First Project</Button>
          <Button onClick={() => { /* open import in your UI */ }} className="bg-[rgba(255,255,255,0.6)]">Import from GitHub</Button>
        </div>
      </div>
    </div>
  );
}
