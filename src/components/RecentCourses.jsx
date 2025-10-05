import React from "react";

export default function RecentCourses({ courses = [], onOpenCourse = () => {} }) {
  const recent = (Array.isArray(courses) ? courses : [])
    .filter(Boolean)
    .sort((a, b) => {
      const getDate = (x) => new Date(x?.enrolledAt || x?.createdAt || x?.updatedAt || 0).getTime();
      return getDate(b) - getDate(a);
    })
    .slice(0, 3);

  if (recent.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Recent Courses</h3>
        <div className="bg-card p-6 border rounded-lg text-muted-foreground">
          You have not enrolled in any courses yet.
        </div>
      </div>
    );
  }

  const getInitial = (str) => (str && String(str).trim().length > 0 ? String(str).trim().charAt(0).toUpperCase() : "?");

  return (
    <div>
      <h3 className="text-xl font-semibold text-foreground mb-4">Recent Courses</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recent.map((c) => {
          const id = c._id || c.id;
          const title = c.title || c.name || "Untitled Course";
          const enrolledAt = c.enrolledAt || c.createdAt || c.updatedAt || null;
          const uni = c.university || {};
          const uniName = uni.name || "";
          const initial = uniName ? getInitial(uniName) : getInitial(title);

          return (
            <div
              key={id}
              /* NOTE: Removed onClick and keyboard handlers so the card itself is NOT clickable.
                 Only the Open button will navigate. */
              className="bg-white border rounded-lg p-4 shadow-sm flex flex-col justify-between transform transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                      style={{
                        background: uniName
                          ? `linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))`
                          : `linear-gradient(135deg, rgba(156,163,175,0.95), rgba(107,114,128,0.95))`,
                      }}
                      aria-hidden="true"
                    >
                      {initial}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-foreground">{title}</h4>
                    <div className="mt-1 text-sm text-gray-600">
                      {uniName ? <span className="font-medium text-gray-800">{uniName}</span> : <span className="text-gray-600">University</span>}
                      {uni.type ? <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">{uni.type}</span> : null}
                    </div>
                    {uni.website && (
                      <div className="mt-2 text-sm truncate">
                        <a
                          href={uni.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:underline"
                        >
                          {uni.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                    {uni.contact && (
                      <div className="mt-1 text-sm text-gray-600">{uni.contact}</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {c.status || "inactive"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <small className="text-xs text-gray-500">Enrolled: {enrolledAt ? new Date(enrolledAt).toLocaleDateString() : "N/A"}</small>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // just in case
                    onOpenCourse?.(id);
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  Open
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
