// src/components/Button.jsx (simple example)
import React from "react";
import clsx from "clsx";

export default function Button({ children, className = "", variant = "default", size = "md", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-md font-medium focus:outline-none";
  const sizeClass = size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-2 text-sm";
  const variantClass =
    variant === "gradient"
      ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm"
      : variant === "ghost"
      ? "bg-transparent"
      : "bg-white border border-slate-200";

  return (
    <button
      {...props}
      className={clsx(base, sizeClass, variantClass, "cursor-pointer", className)}
    >
      {children}
    </button>
  );
}
