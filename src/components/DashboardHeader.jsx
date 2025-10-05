import React from "react";
import { User, Bell } from "lucide-react";

export default function DashboardHeader({ title, subtitle, name = "Student", email = "you@example.com" }) {
  const heading = title || name;

  return (
    <header className="dashboard-header mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className="rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 w-12 h-12 flex items-center justify-center text-white font-bold"
          aria-hidden
        >
          {heading?.[0] ?? "S"}
        </div>

        <div>
          <div className="text-lg font-semibold">{heading}</div>
          {subtitle ? (
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          ) : (
            <div className="text-sm text-muted-foreground">{email}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-md hover:bg-white/10" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <button className="p-2 rounded-md hover:bg-white/10 flex items-center gap-2" aria-label="Account">
          <User size={16} />
          <span className="text-sm">Account</span>
        </button>
      </div>
    </header>
  );
}
