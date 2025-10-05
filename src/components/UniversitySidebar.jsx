// src/components/UniversitySidebar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  PlusCircle,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "../config"; // ensure ../config exports BASE_URL

const navItems = [
  { to: "/university-dashboard", label: "Dashboard", icon: Home },
  { to: "/university-courses", label: "Courses", icon: BookOpen },
  { to: "/university-addcourse", label: "Add Course", icon: PlusCircle },
  { to: "/university-students", label: "Students", icon: Users },
  // use User icon for profile
  { to: "/university-profile", label: "Profile", icon: User },
];

const UniversitySidebar = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        // defensively parse json only if content-type is json
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        const data = ct.includes("application/json")
          ? await res.json().catch(() => ({}))
          : {};

        if (!res.ok) {
          // if not logged in, redirect to login
          const msg = data?.message || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        if (mounted) setEmail(data?.email || "");
      } catch (err) {
        // If not logged in, redirect to login (root)
        if (String(err.message).toLowerCase().includes("not logged in") || String(err.message).startsWith("HTTP 401")) {
          navigate("/");
        } else {
          console.warn("fetchUser error:", err);
        }
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const logoutHandler = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const data = ct.includes("application/json")
        ? await res.json().catch(() => ({}))
        : {};
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      toast.success(data.message || "Logged out");
      navigate("/");
    } catch (err) {
      toast.error(err?.message || "Logout error");
      console.error("logout error", err);
    }
  };

  // memoize initials
  const initials = useMemo(() => {
    const e = String(email || "");
    const parts = e.split("@")[0].split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [email]);

  const navClass = (isActive) =>
    `flex items-center gap-3 p-3 rounded-lg transition duration-150 ${
      isActive
        ? "bg-white/10 text-white ring-1 ring-white/20"
        : "text-white hover:bg-white/5"
    } ${collapsed ? "justify-center" : ""}`;

  const actionBase = `flex items-center gap-3 p-3 rounded-lg transition duration-150 ${
    collapsed ? "justify-center" : ""
  }`;

  const logoutBtnClass = `${actionBase} hover:bg-red-600/10`;
  const logoutIconClass = `w-5 h-5 text-red-400`;
  const logoutTextClass = `text-md text-red-100`;

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-gradient-to-b from-indigo-600 to-indigo-700 text-white min-h-screen flex flex-col transition-width duration-200`}
      aria-label="University sidebar"
    >
      {/* Header */}
      <div
        className={`flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        } gap-3 px-4 py-5 border-b border-indigo-500`}
      >
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/university-dashboard")}
          title="MentorNet"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/university-dashboard");
          }}
        >
          <div
            className={`rounded-md ${
              collapsed ? "p-0.5" : "p-2"
            } bg-white/10 flex items-center justify-center`}
            aria-hidden
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-semibold tracking-tight">
                MentorNet
              </span>
              <span className="text-xs text-indigo-200 mt-0.5">University</span>
            </div>
          )}
        </div>

        {!loadingUser && (
          <button
            onClick={() => setCollapsed((s) => !s)}
            className="hidden md:inline-flex items-center justify-center rounded-full bg-white/10 p-1 hover:bg-white/20 transition"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-white" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Profile */}
      <div
        className={`px-4 py-4 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
      >
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold shadow"
          style={{
            background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
            minWidth: 48,
          }}
          title={email || "University"}
          aria-hidden
        >
          {initials}
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {email ? email.split("@")[0] : "University"}
            </div>
            <div className="text-xs text-indigo-200 truncate">
              {email || "Loading..."}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1" role="navigation" aria-label="Main">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => navClass(isActive)}
            title={label}
          >
            <Icon className="w-5 h-5" aria-hidden />
            {!collapsed && <span className="text-md">{label}</span>}
          </NavLink>
        ))}

        {/* Logout */}
        <button
          onClick={logoutHandler}
          className={logoutBtnClass}
          title="Logout"
          type="button"
        >
          <LogOut className={logoutIconClass} aria-hidden="true" />
          {!collapsed && <span className={logoutTextClass}>Logout</span>}
        </button>
      </nav>

      {/* bottom spacer */}
      <div className="px-3 py-4 border-t border-indigo-500" aria-hidden />
    </aside>
  );
};

export default UniversitySidebar;
