// src/pages/student/StudentProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import { Edit2, Check, X, User } from "lucide-react";
import toast from "react-hot-toast";

const BACKEND_BASE = "http://localhost:5000";

function StudentProfile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    school: "",
    grade: "",
    achievements: "",
    interests: "",
    profilePic: null,
    resume: null,
    _id: null,
    profileCompleted: false,
    profileProgress: 0,
    updatedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState(null);
  const [error, setError] = useState("");
  const [files, setFiles] = useState({ profilePic: null, resume: null });
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_BASE}/api/student-profile/`, {
          credentials: "include",
        });

        if (!res.ok) {
          // If unauthorized, redirect to login
          if (res.status === 401) return navigate("/");
          const text = await res.text().catch(() => "");
          console.error("GET /api/student-profile failed", res.status, text);
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        const raw = data?.profile || data || {};

        const normalized = {
          name: raw.name || "",
          email: raw.email || "",
          phone: raw.phone || "",
          location: raw.location || "",
          school: raw.school || "",
          grade: raw.grade || "",
          achievements: raw.achievements || "",
          interests: raw.interests || "",
          profilePic: raw.profilePic || null,
          resume: raw.resume || null,
          updatedAt: raw.updatedAt || raw.updated_at || raw.updatedAt || null,
          _id: raw._id || raw.id || null,
          profileCompleted:
            raw.profileCompleted || raw.profileCompleted === true || false,
          profileProgress: raw.profileProgress || 0,
        };

        if (mounted) setProfile((p) => ({ ...p, ...normalized }));
      } catch (err) {
        console.error("fetchProfile error:", err);
        if (mounted) setError("Could not load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setProfile((prev) => ({ ...prev, [name]: !!checked }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files: f } = e.target;
    if (!f || f.length === 0) return;
    setFiles((prev) => ({ ...prev, [name]: f[0] }));
    if (name === "profilePic") {
      setProfile((p) => ({ ...p, profilePic: URL.createObjectURL(f[0]) }));
    }
    if (name === "resume") {
      setProfile((p) => ({ ...p, resume: f[0].name }));
    }
  };

  const handleSave = async (section) => {
    try {
      setLoading(true);

      let updateData = {};
      let useMultipart = false;
      const fd = new FormData();

      if (section === "basic") {
        updateData = {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          school: profile.school,
          grade: profile.grade,
        };
        Object.keys(updateData).forEach((k) =>
          fd.append(k, updateData[k] ?? "")
        );
      } else if (section === "other") {
        updateData = {
          achievements: profile.achievements,
          interests: profile.interests,
        };
        fd.append("achievements", profile.achievements || "");
        fd.append("interests", profile.interests || "");
      } else if (section === "files") {
        if (files.profilePic) {
          fd.append("profilePic", files.profilePic);
          useMultipart = true;
        }
        if (files.resume) {
          fd.append("resume", files.resume);
          useMultipart = true;
        }
      }

      const method = profile._id ? "PUT" : "POST";
      const url = `${BACKEND_BASE}/api/student-profile/`;

      let res;
      if (section === "files" && useMultipart) {
        res = await fetch(url, {
          method,
          credentials: "include",
          body: fd,
        });
      } else {
        res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updateData),
        });
      }

      const text = await res.text().catch(() => "");
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch (e) {
        console.log(e);
        body = text;
      }

      if (!res.ok) {
        console.error("Save failed", res.status, body);
        const msg =
          (body && (body.message || body.error)) || "Failed to save profile";
        throw new Error(msg);
      }

      const returned = (body && (body.profile || body)) || {};
      const merged = {
        ...profile,
        name: returned.name ?? profile.name,
        email: returned.email ?? profile.email,
        phone: returned.phone ?? profile.phone,
        location: returned.location ?? profile.location,
        school: returned.school ?? profile.school,
        grade: returned.grade ?? profile.grade,
        achievements: returned.achievements ?? profile.achievements,
        interests: returned.interests ?? profile.interests,
        profilePic: returned.profilePic ?? profile.profilePic,
        resume: returned.resume ?? profile.resume,
        updatedAt: returned.updatedAt ?? profile.updatedAt,
        _id: returned._id ?? profile._id,
        profileCompleted: returned.profileCompleted ?? profile.profileCompleted,
        profileProgress: returned.profileProgress ?? profile.profileProgress,
      };

      setProfile(merged);
      setEditSection(null);

      // Use toast instead of alert
      if (merged.profileCompleted) {
        toast.success("Profile completed — redirecting to dashboard.");
        setTimeout(() => navigate("/student-dashboard"), 700);
        return;
      }

      toast.success("Profile saved successfully");
    } catch (err) {
      console.error("handleSave error:", err);
      toast.error(err.message || "Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg bg-gray-50">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-600 bg-gray-50">
        {error}
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <StudentSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">
                Student Profile
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                View and edit your student profile details.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Last updated</div>
                <div className="text-sm text-gray-700">
                  {profile.updatedAt
                    ? new Date(profile.updatedAt).toLocaleDateString()
                    : "—"}
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center shadow-lg text-white font-semibold">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
            {/* Basic Info */}
            <section className="p-6 border border-gray-100 rounded-xl bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-gray-800">
                    Basic Info
                  </h3>

                  {/* Warning chip shown next to Basic Info header when profile incomplete */}
                  {!profile.profileCompleted && (
                    <div className="text-sm rounded-full px-3 py-1 bg-red-50 border border-red-200 text-red-700 font-medium">
                      Complete the Basic Info to unlock the app
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editSection !== "basic" ? (
                    <button
                      onClick={() => setEditSection("basic")}
                      title="Edit Basic Info"
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                    >
                      <Edit2 className="h-5 w-5 text-indigo-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSave("basic")}
                        title="Save Basic Info"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <Check className="h-5 w-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => setEditSection(null)}
                        title="Cancel"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editSection === "basic" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-md bg-white text-sm border-indigo-300"
                    placeholder="Full name"
                  />
                  <input
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-md bg-white text-sm border-indigo-300"
                    placeholder="Email"
                  />
                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-md bg-white text-sm border-indigo-300"
                    placeholder="Phone"
                  />
                  <input
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-md bg-white text-sm border-indigo-300"
                    placeholder="Location / City"
                  />
                  <input
                    name="school"
                    value={profile.school}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-md bg-white text-sm border-indigo-300"
                    placeholder="School"
                  />
                  <input
                    name="grade"
                    value={profile.grade}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-md bg-white text-sm border-indigo-300"
                    placeholder="Grade / Year"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-md bg-gray-50 border text-sm">
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="text-sm text-gray-800">
                      {profile.name || "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border text-sm">
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-sm text-gray-800">
                      {profile.email || "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border text-sm">
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="text-sm text-gray-800">
                      {profile.phone || "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border text-sm">
                    <div className="text-xs text-gray-500">Location</div>
                    <div className="text-sm text-gray-800">
                      {profile.location || "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border text-sm">
                    <div className="text-xs text-gray-500">School</div>
                    <div className="text-sm text-gray-800">
                      {profile.school || "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border text-sm">
                    <div className="text-xs text-gray-500">Grade / Year</div>
                    <div className="text-sm text-gray-800">
                      {profile.grade || "—"}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Achievements & Interests */}
            <section className="p-6 border border-gray-100 rounded-xl bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Achievements & Interests
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Academic highlights, hobbies and career interests.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {editSection !== "other" ? (
                    <button
                      onClick={() => setEditSection("other")}
                      title="Edit Other Details"
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                    >
                      <Edit2 className="h-5 w-5 text-indigo-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSave("other")}
                        title="Save Other Details"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <Check className="h-5 w-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => setEditSection(null)}
                        title="Cancel Other Edit"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editSection === "other" ? (
                <div className="grid grid-cols-1 gap-4">
                  <textarea
                    name="achievements"
                    value={profile.achievements}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-md bg-white text-sm border-indigo-300"
                    rows={4}
                    placeholder="Achievements (awards, certifications, competitions)"
                  />
                  <textarea
                    name="interests"
                    value={profile.interests}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-md bg-white text-sm border-indigo-300"
                    rows={3}
                    placeholder="Interests (hobbies, career interests, skills)"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500">Achievements</div>
                    <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                      {profile.achievements || "No achievements added"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Interests</div>
                    <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                      {profile.interests || "No interests added"}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Files summary */}
            <section className="p-6 border border-gray-100 rounded-xl bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Files</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Profile picture and resume (upload endpoint expected on
                    backend).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {editSection !== "files" ? (
                    <button
                      onClick={() => setEditSection("files")}
                      title="Edit Files"
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                    >
                      <Edit2 className="h-5 w-5 text-indigo-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSave("files")}
                        title="Save Files"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <Check className="h-5 w-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => setEditSection(null)}
                        title="Cancel Files Edit"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-50 border flex items-center justify-center overflow-hidden">
                    {profile.profilePic ? (
                      <img
                        src={profile.profilePic}
                        alt="profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {profile.name || "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {profile.resume ? "Resume uploaded" : "No resume"}
                    </div>
                  </div>
                </div>

                {editSection === "files" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600">
                      Profile picture (png/jpg)
                    </label>
                    <input
                      type="file"
                      name="profilePic"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <label className="text-xs text-gray-600">
                      Resume (pdf)
                    </label>
                    <input
                      type="file"
                      name="resume"
                      onChange={handleFileChange}
                      accept="application/pdf"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-700">
                    {profile.profilePic
                      ? "Profile picture available"
                      : "No picture"}
                    <span className="mx-2">•</span>
                    {profile.resume ? "Resume available" : "No resume"}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
