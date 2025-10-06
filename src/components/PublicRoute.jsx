// src/components/PublicRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { BASE_URL } from "../config";

/**
 * PublicRoute - if the user is logged in, redirect to their dashboard.
 * Otherwise render children (landing/login/signup).
 */
export default function PublicRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        const ct = (res.headers.get("content-type") || "").toLowerCase();
        const data = ct.includes("application/json")
          ? await res.json().catch(() => ({}))
          : {};

        if (!res.ok) {
          // not logged in
          if (mounted) setChecking(false);
          return;
        }

        // logged in -> choose redirect based on role
        const role = data?.user?.role || data?.role || "";
        if (role === "university") setRedirectTo("/university-dashboard");
        else setRedirectTo("/student-dashboard");
      } catch (err) {
        console.warn("PublicRoute auth check failed:", err);
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    // optional: return a small loader; here we return null for minimalism
    return null;
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
