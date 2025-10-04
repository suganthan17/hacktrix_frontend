import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/*
  role: "student" (default) | "university"
  - student -> hits GET /api/student-profile/
  - university -> hits GET /api/university-profile/
*/
const BACKEND_BASE = "http://localhost:5000";

export default function RequireProfileComplete({ children, role = "student" }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const endpoint =
          role === "university"
            ? "/api/university-profile/"
            : "/api/student-profile/";

        const res = await fetch(`${BACKEND_BASE}${endpoint}`, {
          credentials: "include",
        });

        // not logged in
        if (res.status === 401) {
          // send to login
          navigate("/", { replace: true });
          return;
        }

        // if backend returns 403 (forbidden) then profile is incomplete
        if (res.status === 403) {
          const redirectTo =
            role === "university" ? "/university-profile" : "/student-profile";
          navigate(redirectTo, { replace: true });
          return;
        }

        if (!res.ok) {
          // unknown problem — conservative fallback: redirect to profile page so user can complete
          const redirectTo =
            role === "university" ? "/university-profile" : "/student-profile";
          console.warn("RequireProfileComplete unexpected status", res.status);
          navigate(redirectTo, { replace: true });
          return;
        }

        const data = await res.json().catch(() => ({}));

        // check required fields (same logic we used for student profile)
        const requiredFields =
          role === "university"
            ? ["name", "email", "phone"] // minimal for university; change if you want stronger checks
            : ["name", "email", "phone", "school", "grade"];

        const present = requiredFields.every(
          (k) => !!(data?.[k] || data?.profile?.[k])
        );

        if (!present) {
          const redirectTo =
            role === "university" ? "/university-profile" : "/student-profile";
          navigate(redirectTo, { replace: true });
          return;
        }

        // all good
        if (mounted) setChecking(false);
      } catch (err) {
        console.error("RequireProfileComplete error:", err);
        // on network/server error be conservative and redirect to profile (so user can try to fix)
        const redirectTo =
          role === "university" ? "/university-profile" : "/student-profile";
        navigate(redirectTo, { replace: true });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate, role]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Checking profile…
      </div>
    );
  }

  return <>{children}</>;
}
