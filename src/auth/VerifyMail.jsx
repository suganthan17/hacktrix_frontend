import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { BASE_URL } from "../config";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast.success(data.message, { duration: 4000 });
        setTimeout(() => navigate("/"), 2000);
      } catch (err) {
        toast.error(err.message, { duration: 4000 });
      } finally {
        setLoading(false);
      }
    };
    if (token) verify();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50 font-sans">
      <Toaster position="top-center" />
      {loading ? <p className="text-gray-700 text-lg">Verifying your email...</p> : <p className="text-gray-700 text-lg">Redirecting to login...</p>}
    </div>
  );
};

export default VerifyEmail;
