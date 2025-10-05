import axios from "axios";

const RAW_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : "http://localhost:5000";

export const API_BASE = RAW_BASE.replace(/\/$/, "") + "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
      }
    } catch (e) {}
    return config;
  },
  (err) => Promise.reject(err)
);

export const apiGet = (path, config = {}) =>
  api.get(path, config).then((res) => res.data);
export const apiPost = (path, data, config = {}) =>
  api.post(path, data, config).then((res) => res.data);
export const apiPut = (path, data, config = {}) =>
  api.put(path, data, config).then((res) => res.data);
export const apiDelete = (path, config = {}) =>
  api.delete(path, config).then((res) => res.data);

export default api;

export async function safeFetchJson(urlOrPath, options = {}) {
  const isRelative = typeof urlOrPath === "string" && urlOrPath.startsWith("/");
  const url = isRelative ? API_BASE.replace(/\/api$/, "") + urlOrPath : urlOrPath;
  const init = {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.raw = raw;
    throw err;
  }
  if (!contentType.includes("application/json")) {
    const err = new Error("Invalid server response: expected JSON");
    err.status = res.status;
    err.raw = raw;
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    e.raw = raw;
    throw e;
  }
}

export async function uploadForm(path, formData, { method = "POST", extraHeaders = {} } = {}) {
  const isRelative = typeof path === "string" && path.startsWith("/");
  const url = isRelative ? API_BASE.replace(/\/api$/, "") + path : path;
  const res = await fetch(url, {
    method,
    credentials: "include",
    body: formData,
    headers: { ...extraHeaders },
  });
  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.raw = raw;
    throw err;
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      e.raw = raw;
      throw e;
    }
  }
  return raw;
}

export async function apiGetCoursesWithUniversity(path = "/students/me/courses") {
  // 1) Try populate query param (if backend supports it)
  try {
    const tryPopulatePath = path + (path.includes("?") ? "&" : "?") + "populate=university";
    const populated = await apiGet(tryPopulatePath).catch(() => null);
    if (Array.isArray(populated) && populated.length > 0 && populated.some(c => c.university && typeof c.university === "object")) {
      return populated;
    }
  } catch (e) {
    // ignore and fall back
  }

  // 2) Fallback: fetch courses, then fetch universities client-side
  const courses = await apiGet(path);
  if (!Array.isArray(courses) || courses.length === 0) return courses;

  const extractUniId = (c) => {
    if (!c) return null;
    if (typeof c.university === "string" && c.university.trim()) return c.university;
    if (c.university && (c.university._id || c.university.id)) return c.university._id || c.university.id;
    if (c.universityId) return c.universityId;
    if (c.university_id) return c.university_id;
    if (c.universityRef) return c.universityRef;
    // some backends might attach nested fields like c.meta?.universityId
    if (c.meta && (c.meta.universityId || c.meta.university_id)) return c.meta.universityId || c.meta.university_id;
    return null;
  };

  const idList = courses
    .map(extractUniId)
    .filter(Boolean)
    .map(String);

  if (idList.length === 0) return courses;

  const uniqueIds = Array.from(new Set(idList));

  const uniFetches = uniqueIds.map(async (id) => {
    try {
      const data = await apiGet(`/universities/${id}`);
      return { id: String(id), data };
    } catch (err) {
      return { id: String(id), data: null };
    }
  });

  const uniResults = await Promise.all(uniFetches);
  const uniMap = uniResults.reduce((acc, r) => {
    if (r && r.id) acc[r.id] = r.data || null;
    return acc;
  }, {});

  const enriched = courses.map((c) => {
    const uniId = extractUniId(c);
    if (!uniId) return c;
    const uni = uniMap[String(uniId)] || null;
    if (c.university && typeof c.university === "object" && (c.university.name || c.university.logoUrl)) {
      return c;
    }
    return { ...c, university: uni ? uni : c.university || null };
  });

  return enriched;
}
