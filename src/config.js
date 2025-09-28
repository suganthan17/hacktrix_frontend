const isLocal = window.location.hostname === "localhost";

export const BASE_URL = isLocal
  ? "http://localhost:5000"
  : "https://your-backend.onrender.com";
