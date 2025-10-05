// src/components/StatsCard.jsx
import React from "react";

export default function StatsCard({ title, value, delta, children }) {
  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-card to-card/50 border border-border shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
        </div>
        {delta && (
          <div
            className={`text-sm font-medium ${
              delta.startsWith("+") ? "text-accent" : "text-destructive"
            }`}
          >
            {delta}
          </div>
        )}
      </div>

      {/* Optional extra content (e.g., mini chart, icon, progress) */}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
