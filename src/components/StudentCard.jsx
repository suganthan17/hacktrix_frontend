import React from "react";
import { ArrowRight, Mail, MapPin, BookOpen, Award } from "lucide-react";

export default function StudentCard({
  enrollment,
  profile,
  onViewProgress,
}) {
  const student = enrollment.student || enrollment.studentId || {};
  const sid = String(student?._id || student?.id || "");
  const name = (profile && profile.name) || student?.name || "Unknown";
  const email = (profile && profile.email) || student?.email || "-";
  const location = (profile && profile.location) || student?.location || "-";
  const school = (profile && profile.school) || student?.school || "-";
  const grade = (profile && profile.grade) || student?.grade || "-";
  const initials =
    name && name.length
      ? name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
      : "S";
  return (
    <div className="bg-white rounded-2xl p-4 shadow hover:shadow-lg transition">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">{name}</div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3 text-slate-400" /> <span>{email}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span>{school}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-slate-400" />
              <span>{grade}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="text-xs text-slate-400">
              Enrolled:{" "}
              {enrollment.enrolledAt
                ? new Date(enrollment.enrolledAt).toLocaleDateString()
                : "-"}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewProgress(enrollment)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                View Progress <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
