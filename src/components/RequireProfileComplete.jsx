// MentorNet_frontend/src/components/RequireProfileComplete.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_BASE =  "http://localhost:5000";

export default function RequireProfileComplete({ children }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/student-profile/`, {
          credentials: "include",
        });

        if (res.status === 401) {
          // not logged in -> send to login
          navigate("/");
          return;
        }

        // If server says forbidden (profile incomplete for actions), redirect
        if (res.status === 403) {
          navigate("/student-profile");
          return;
        }

        if (!res.ok) {
          // allow the guard to let server-side middleware handle cases; redirect to profile as conservative fallback
          console.warn("RequireProfileComplete: unexpected status", res.status);
          navigate("/student-profile");
          return;
        }

        const data = await res.json();
        // data may be {} or a profile object; check required fields
        const required = ["name", "email", "phone", "school", "grade"];
        const present = required.every((k) => !!(data?.[k]));

        if (!present) {
          navigate("/student-profile");
          return;
        }

        // ok
        if (mounted) setChecking(false);
      } catch (err) {
        console.error("RequireProfileComplete error:", err);
        navigate("/student-profile");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Checking profile…
      </div>
    );
  }

  return <>{children}</>;
}
