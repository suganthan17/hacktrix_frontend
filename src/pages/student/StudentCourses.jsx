import React, { useEffect, useMemo, useState } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  Funnel,
  ChevronDown,
  Clock,
  Calendar,
  PlayCircle,
  Tag,
} from "lucide-react";

const BACKEND_BASE = "http://localhost:5000";

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI controls
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("relevance"); // relevance | newest | duration
  const [showFilters, setShowFilters] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_BASE}/api/courses/public`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch courses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      const res = await fetch(
        `${BACKEND_BASE}/api/enrollments/${courseId}/enroll`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Enrollment failed");

      toast.success(data.message);

      // Update local state immediately
      setCourses((prev) =>
        prev.map((c) => (c._id === courseId ? { ...c, enrolled: true } : c))
      );
    } catch (err) {
      toast.error(err.message || "Enrollment error");
      console.error(err);
    }
  };

  // Format date helper
  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  // derived categories for filter select
  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => c.category && set.add(c.category));
    return ["All", ...Array.from(set)];
  }, [courses]);

  // Filtered + sorted list
  const visibleCourses = useMemo(() => {
    let list = courses.slice();

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q) ||
          (c.category || "").toLowerCase().includes(q)
      );
    }

    if (category !== "All") {
      list = list.filter((c) => c.category === category);
    }

    if (sortBy === "newest") {
      list = list.sort(
        (a, b) =>
          new Date(b.createdAt || b.startDate || 0) -
          new Date(a.createdAt || a.startDate || 0)
      );
    } else if (sortBy === "duration") {
      list = list.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    }

    return list;
  }, [courses, query, category, sortBy]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">
              Browse Courses
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Find courses, watch previews and enroll — curated for you.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <PlayCircle className="h-5 w-5 text-slate-400" />
              <span className="font-medium">{courses.length}</span>
              <span className="text-xs text-slate-400 ml-2">available</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md"
                aria-expanded={showFilters}
              >
                <Funnel className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-slate-700">Filters</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 w-full">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses, categories or topics"
                  className="ml-3 w-full bg-transparent outline-none text-sm text-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-100 bg-white text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-100 bg-white text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="duration">Shortest duration</option>
              </select>
            </div>
          </div>

          {/* optional expanded filters */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Duration &gt; 0 shows only timed courses</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Upcoming courses filter (client-side)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Tag className="h-4 w-4 text-slate-400" />
                <span>Use category selector to filter by tags</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-slate-500">Loading courses…</div>
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No courses found
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course) => (
              <article
                key={course._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition p-5 flex flex-col"
              >
                {/* Media */}
                <div className="relative h-40 rounded-lg overflow-hidden mb-4 bg-slate-50 flex items-center justify-center">
                  {course.videoUrl ? (
                    <video
                      src={`${BACKEND_BASE}${course.videoUrl}`}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      controls={false}
                      poster={course.thumbnail || ""}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <PlayCircle className="h-10 w-10" />
                      <span className="text-xs">No preview available</span>
                    </div>
                  )}

                  {/* small badge */}
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-slate-700">
                    {course.category || "General"}
                  </div>
                </div>

                {/* Course Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 leading-tight">
                    {course.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                    {course.description || "No description provided."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Duration</div>
                        <div className="font-medium">
                          {course.duration ?? "N/A"} weeks
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Schedule</div>
                        <div className="font-medium">
                          {fmtDate(course.startDate)} —{" "}
                          {fmtDate(course.endDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enroll */}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    {course.instructor || "Instructor info unavailable"}
                  </div>

                  <div>
                    {course.enrolled ? (
                      <button
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-not-allowed opacity-80"
                        disabled
                      >
                        Enrolled
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course._id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Enroll
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
