// src/components/CourseCard.jsx
import React from "react";

export default function CourseCard({ course }) {
  return (
    <article className="p-5 rounded-lg border border-border bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-md transition-all">
      {/* Header row: title + progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{course.name}</h3>
          <p className="text-sm text-muted-foreground">{course.university}</p>
        </div>
        <div className="text-sm font-medium text-muted-foreground">{course.progress}%</div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-[hsl(var(--input))] rounded-full mt-3 overflow-hidden">
        <div
          className="h-2 bg-gradient-to-r from-primary to-accent rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, course.progress))}%` }}
        />
      </div>

      {/* Footer row: tags + CTA */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2 flex-wrap">
          {course.status && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(34,197,94,0.12)] text-accent">
              {course.status}
            </span>
          )}
          {course.level && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(99,102,241,0.08)] text-foreground">
              {course.level}
            </span>
          )}
        </div>
        <button className="px-3 py-1.5 rounded-md bg-gradient-to-r from-primary to-accent text-white text-sm font-medium hover:opacity-90">
          Open
        </button>
      </div>
    </article>
  );
}
