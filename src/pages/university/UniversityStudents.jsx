// src/pages/UniversityStudents.jsx
import React, { useEffect, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import StudentProgressModal from "../../components/StudentProgressModal";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowRight,
  Mail,
  MapPin,
  BookOpen,
  Award,
  RefreshCw,
} from "lucide-react";
import { apiGet, API_BASE, safeFetchJson } from "../../utils/api";
const BACKEND_BASE = "http://localhost:5000";

export default function UniversityStudents() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [studentProfiles, setStudentProfiles] = useState({});

  useEffect(() => {
    console.log("s:",studentProfiles);
  }, [studentProfiles]);

  // fetch courses for this university (assumes /api/courses/university exists)
  const fetchUniversityCourses = async () => {
    try {
      setLoadingCourses(true);
      const data = await apiGet("/courses/university");
      const arr = Array.isArray(data) ? data : [];
      setCourses(arr);
      if (arr.length && !selectedCourse) setSelectedCourse(arr[0]);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchEnrollments = async (course) => {
    if (!course) return;
    try {
      setLoadingEnrollments(true);
      const res = await fetch(`${BACKEND_BASE}/api/enrollments/${course._id}`, {
        credentials: "include",
      });
      console.log("res: ",res)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load enrollments");
      }
      const data = await res.json().catch(() => []);
      const normalized = Array.isArray(data)
        ? data.map((en) => {
            const student =
              en.student && typeof en.student === "object"
                ? en.student
                : en.studentId && typeof en.studentId === "object"
                ? en.studentId
                : en.studentId && typeof en.studentId === "string"
                ? { _id: en.studentId }
                : en.student && typeof en.student === "string"
                ? { _id: en.student }
                : null;
            return {
              ...en,
              enrollmentId: en.enrollmentId || en._id || en.id,
              student,
            };
          })
        : [];
      setEnrollments(normalized);
      const ids = normalized
        .map((en) => (en.student && (en.student._id || en.student.id)) || null)
        .filter(Boolean)
        .map(String);
      fetchStudentProfiles(ids);
    } catch (err) {
      toast.error(err.message || "Failed to load enrollments");
      setEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const fetchStudentProfiles = async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const uniq = Array.from(new Set(ids.map(String)));
    const current = { ...studentProfiles };
    const toFetch = uniq.filter(
      (id) => !Object.prototype.hasOwnProperty.call(current, id)
    );
    if (toFetch.length === 0) return;
    const promises = toFetch.map(async (id) => {
      try {
        console.log("id : ",id)
        const data = await safeFetchJson(
          `${BACKEND_BASE}/api/student-profile/${encodeURIComponent(id)}`,
          { method: "GET" }
        );
        
        const raw = data?.profile || data || null;
        if (!raw) return { id, profile: null };
        const normalized = {
          _id: raw._id || raw.id || id,
          name: raw.name || raw.fullName || raw.displayName || null,
          email: raw.email || null,
          phone: raw.phone || null,
          location: raw.location || null,
          school: raw.school || null,
          grade: raw.grade || null,
          achievements: raw.achievements || null,
          interests: raw.interests || null,
          profilePic: raw.profilePic || null,
          resume: raw.resume || null,
          updatedAt: raw.updatedAt || raw.updated_at || null,
        };
        return { id, profile: normalized };
      } catch {
        return { id, profile: null };
      }
    });
    const settled = await Promise.allSettled(promises);
    const next = { ...current };
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value && s.value.id)
        next[s.value.id] = s.value.profile;
    }
    console.log("net : ",next)
    setStudentProfiles(next);
  };


  useEffect(() => {
    fetchUniversityCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedStudent(null);
    setSelectedStudentProfile(null);
    setModalOpen(false);
    if (selectedCourse) fetchEnrollments(selectedCourse);
    else setEnrollments([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  const normalizeStudentFromEnrollment = (en) => {
    if (!en) return null;
    if (en.student && typeof en.student === "object") return en.student;
    if (en.student && typeof en.student === "string")
      return { _id: en.student };
    if (en.studentId && typeof en.studentId === "object") return en.studentId;
    if (en.studentId && typeof en.studentId === "string")
      return { _id: en.studentId };
    if (en._id || en.id || (en.name && typeof en.name === "string"))
      return { _id: en._id || en.id, name: en.name, email: en.email };
    return null;
  };

  const openStudentModal = async (enrollment) => {
    const student = normalizeStudentFromEnrollment(enrollment);
    if (!student || !student._id) {
      toast.error("Student id missing — cannot show progress");
      return;
    }
    const sid = String(student._id);
    console.log("sidL ",sid)
    let profile = studentProfiles[sid];
    if (profile === undefined) {
      try {
        const data = await apiGet(
          `/student-profile/${encodeURIComponent(sid)}`
        ).catch(() => null);  
        console.log("data ",data)
        const raw = data?.profile || data || null;
        profile = raw
          ? {
              _id: raw._id || raw.id || sid,
              name: raw.name || raw.fullName || null,
              email: raw.email || null,
              phone: raw.phone || null,
              location: raw.location || null,
              school: raw.school || null,
              grade: raw.grade || null,
              profilePic: raw.profilePic || null,
              updatedAt: raw.updatedAt || raw.updated_at || null,
              achievements: raw.achievements || null,
              interests: raw.interests || null,
              resume: raw.resume || null,
            }
          : null;
        setStudentProfiles((prev) => ({ ...prev, [sid]: profile }));
      } catch {
        setStudentProfiles((prev) => ({ ...prev, [sid]: null }));
        profile = null;
      }
    }
    setSelectedStudent(student);
    setSelectedStudentProfile(profile || null);
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-white to-slate-50">
      <UniversitySidebar />
      <main className="flex-1 p-6 lg:p-12">
        <Toaster position="top-right" />
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Students & Progress
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Select a course to view enrolled students and track progress.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-400">Courses</div>
              <div className="text-lg font-medium text-slate-700">
                {courses.length}
              </div>
              <button
                onClick={() => fetchUniversityCourses()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow hover:shadow-md border border-gray-100"
              >
                <RefreshCw className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-slate-700">Refresh</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <div className="w-full md:w-72">
                <label className="text-xs text-slate-500">Course</label>
                <select
                  value={selectedCourse?._id || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const c = courses.find((x) => x._id === id);
                    setSelectedCourse(c || null);
                  }}
                  className="mt-2 w-full border rounded-lg px-3 py-2 bg-white text-sm"
                >
                  <option value="">-- Choose course --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingCourses ? (
              <div className="py-16 text-center text-slate-500">
                Loading courses…
              </div>
            ) : !selectedCourse ? (
              <div className="py-20 text-center text-slate-600">
                No course selected — choose a course to see enrolled students.
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedCourse.name}
                    </h2>
                    <div className="text-sm text-slate-500">
                      {selectedCourse.category || "General"} •{" "}
                      {selectedCourse.lessons ?? "-"} lessons
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    {enrollments.length} students
                  </div>
                </div>

                {loadingEnrollments ? (
                  <div className="py-16 text-center text-slate-500">
                    Loading students…
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">
                    No students enrolled yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrollments.map((en) => {
                      const student = en.student || en.studentId || {};
                      const sid = String(student?._id || student?.id || "");
                      const profile = studentProfiles[sid];
                      const name =
                        (profile && profile.name) || student?.name || "Unknown";
                      const email =
                        (profile && profile.email) || student?.email || "-";
                      const location =
                        (profile && profile.location) ||
                        student?.location ||
                        "-";
                      const school =
                        (profile && profile.school) || student?.school || "-";
                      const grade =
                        (profile && profile.grade) || student?.grade || "-";
                      const initials =
                        name && name.length
                          ? name
                              .split(" ")
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join("")
                          : "S";

                      return (
                        <div
                          key={en.enrollmentId || en._id || sid}
                          className="bg-white rounded-2xl p-4 shadow hover:shadow-lg transition"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white font-semibold">
                                {initials}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-sm font-medium text-slate-900">
                                    {name}
                                  </div>
                                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                    <Mail className="h-3 w-3 text-slate-400" />{" "}
                                    <span>{email}</span>
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
                                  {en.enrolledAt
                                    ? new Date(
                                        en.enrolledAt
                                      ).toLocaleDateString()
                                    : "-"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openStudentModal(en)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                                  >
                                    View Progress{" "}
                                    <ArrowRight className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {modalOpen && selectedStudent && (
        <StudentProgressModal
          student={selectedStudent}
          studentId={selectedStudent._id || selectedStudent.id}
          studentProfile={
            selectedStudentProfile ||
            studentProfiles[String(selectedStudent._id || selectedStudent.id)]
          }
          courseId={selectedCourse?._id || selectedCourse?.id}
          onClose={() => {
            setModalOpen(false);
            setSelectedStudent(null);
            setSelectedStudentProfile(null);
            setTimeout(() => fetchEnrollments(selectedCourse), 300);
          }}
        />
      )}
    </div>
  );
}
