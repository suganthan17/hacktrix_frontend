import React, { useEffect, useState } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import { Edit2, Check, X, User, Link as LinkIcon } from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://your-production-backend.com";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState(null);
  const [error, setError] = useState("");

  // fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/student-profile/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();

        // normalize
        const normalized = {
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          school: data.school || "",
          grade: data.grade || "",
          achievements: data.achievements || "",
          interests: data.interests || "",
          profilePic: data.profilePic || null,
          resume: data.resume || null,
          updatedAt: data.updatedAt || data.updated_at || null,
        };

        setProfile(normalized);
      } catch (err) {
        console.error(err);
        setError("Could not load profile.");
        toast.error("Error fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (!profile) return;
    if (type === "checkbox") {
      setProfile((p) => ({ ...p, [name]: !!checked }));
    } else {
      setProfile((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSave = async (section) => {
    try {
      if (!profile) return;
      setLoading(true);

      let updateData = {};
      if (section === "basic") {
        updateData = {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          school: profile.school,
          grade: profile.grade,
        };
      } else if (section === "other") {
        updateData = {
          achievements: profile.achievements,
          interests: profile.interests,
        };
      } else if (section === "files") {
        updateData = {
          // file handling requires multipart upload — placeholder
        };
      }

      const method = profile._id ? "PUT" : "POST";
      const res = await fetch(`${BASE_URL}/api/student-profile/`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || "Failed to save profile");
      }
      const data = await res.json();
      const updated = data.profile || { ...profile, ...updateData };

      // normalize nested values
      setProfile({
        name: updated.name || updated.name || profile.name,
        email: updated.email || profile.email,
        phone: updated.phone || profile.phone,
        location: updated.location || profile.location,
        school: updated.school || profile.school,
        grade: updated.grade || profile.grade,
        achievements: updated.achievements || profile.achievements,
        interests: updated.interests || profile.interests,
        profilePic: updated.profilePic || profile.profilePic,
        resume: updated.resume || profile.resume,
        updatedAt: updated.updatedAt || profile.updatedAt,
        _id: updated._id || profile._id,
      });

      setEditSection(null);
      toast.success("Profile saved successfully");
    } catch (err) {
      console.error(err);
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

  if (!profile)
    return (
      <div className="flex justify-center items-center h-screen text-gray-700 bg-gray-50">
        No profile data.
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <StudentSidebar />

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">
                Student Profile
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                View and edit student personal details, achievements and
                interests.
              </p>
            </div>

            <div className="flex items-center gap-4">
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
                <h3 className="text-lg font-medium text-gray-800">
                  Basic Info
                </h3>

                <div className="flex items-center gap-2">
                  {editSection !== "basic" ? (
                    <button
                      onClick={() => setEditSection("basic")}
                      title="Edit Basic Info"
                      aria-label="Edit Basic Info"
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100 focus:outline-none"
                    >
                      <Edit2 className="h-5 w-5 text-indigo-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSave("basic")}
                        title="Save Basic Info"
                        aria-label="Save Basic Info"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <Check className="h-5 w-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => setEditSection(null)}
                        title="Cancel"
                        aria-label="Cancel Basic Edit"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="name"
                  value={profile.name || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="Full name"
                />
                <input
                  name="email"
                  value={profile.email || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="Email"
                />
                <input
                  name="phone"
                  value={profile.phone || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="Phone"
                />
                <input
                  name="location"
                  value={profile.location || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="Location (city)"
                />
                <input
                  name="school"
                  value={profile.school || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="School"
                />
                <input
                  name="grade"
                  value={profile.grade || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="Grade / Year"
                />
              </div>
            </section>

            {/* Achievements & Interests (Other Details) */}
            <section className="p-6 border border-gray-100 rounded-xl bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Achievements & Interests
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Academic and extracurricular highlights, hobbies and career
                    interests.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {editSection !== "other" ? (
                    <button
                      onClick={() => setEditSection("other")}
                      title="Edit Other Details"
                      aria-label="Edit Other Details"
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                    >
                      <Edit2 className="h-5 w-5 text-indigo-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSave("other")}
                        title="Save Other Details"
                        aria-label="Save Other Details"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <Check className="h-5 w-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => setEditSection(null)}
                        title="Cancel"
                        aria-label="Cancel Other Edit"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <textarea
                  name="achievements"
                  value={profile.achievements || ""}
                  onChange={handleChange}
                  disabled={editSection !== "other"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "other"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  rows={4}
                  placeholder="Achievements (awards, certifications, competitions)"
                />
                <textarea
                  name="interests"
                  value={profile.interests || ""}
                  onChange={handleChange}
                  disabled={editSection !== "other"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "other"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  rows={3}
                  placeholder="Interests (hobbies, career interests, skills)"
                />
              </div>
            </section>

            {/* Files summary (Profile pic / Resume) */}
            <section className="p-6 border border-gray-100 rounded-xl bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Files</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Profile picture and resume status (upload handling not
                    included — implement multipart endpoint when ready).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {editSection !== "files" ? (
                    <button
                      onClick={() => setEditSection("files")}
                      title="Edit Files"
                      aria-label="Edit Files"
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                    >
                      <Edit2 className="h-5 w-5 text-indigo-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSave("files")}
                        title="Save Files"
                        aria-label="Save Files"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <Check className="h-5 w-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => setEditSection(null)}
                        title="Cancel Files Edit"
                        aria-label="Cancel Files Edit"
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

                <div className="text-sm text-gray-700">
                  {profile.profilePic
                    ? "Profile picture available"
                    : "No picture"}
                  <span className="mx-2">•</span>
                  {profile.resume ? "Resume available" : "No resume"}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
