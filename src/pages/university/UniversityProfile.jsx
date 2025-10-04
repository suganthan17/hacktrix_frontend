// src/pages/university/UniversityProfile.jsx
import React, { useEffect, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import { Edit2, Check, X, Link as LinkIcon, AlertTriangle } from "lucide-react";

const BACKEND_BASE = "http://localhost:5000";

function UniversityProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState(null);
  const [error, setError] = useState("");

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_BASE}/api/university-profile/`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();

        // Ensure nested objects exist
        data.location = data.location || { city: "", state: "", country: "" };
        data.socialLinks = data.socialLinks || {
          linkedin: "",
          twitter: "",
          facebook: "",
        };

        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Basic completeness check (fields required to access app)
  const isBasicComplete = (() => {
    if (!profile) return false;
    const required = [
      "name",
      "email",
      "phone",
      "address",
      // require either city or country for location
    ];
    const allPresent =
      required.every((k) => !!(profile[k] && String(profile[k]).trim())) &&
      !!(
        profile.location &&
        (String(profile.location.city || "").trim() ||
          String(profile.location.country || "").trim())
      );
    return allPresent;
  })();

  const showBasicWarning = profile && !isBasicComplete;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        location: { ...prev.location, [key]: value },
      }));
    } else if (name.startsWith("socialLinks.")) {
      const key = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [key]: value },
      }));
    } else if (type === "checkbox") {
      setProfile((prev) => ({ ...prev, [name]: checked }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (section) => {
    try {
      if (!profile) return;

      let updateData = {};
      if (section === "basic") {
        updateData = {
          name: profile.name,
          website: profile.website,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          location: profile.location,
        };
      } else if (section === "links") {
        updateData = { socialLinks: profile.socialLinks };
      } else if (section === "other") {
        updateData = {
          description: profile.description,
          adminName: profile.adminName,
          verified: profile.verified,
        };
      }

      const method = profile._id ? "PUT" : "POST";
      const res = await fetch(`${BACKEND_BASE}/api/university-profile/`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to save profile");
      }
      const data = await res.json();

      // Ensure nested objects exist
      const updatedProfile = data.profile || { ...profile, ...updateData };
      updatedProfile.location = updatedProfile.location || {
        city: "",
        state: "",
        country: "",
      };
      updatedProfile.socialLinks = updatedProfile.socialLinks || {
        linkedin: "",
        twitter: "",
        facebook: "",
      };

      setProfile(updatedProfile);
      setEditSection(null);
      alert("Profile saved successfully");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save");
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

  const location = profile.location || { city: "", state: "", country: "" };
  const socialLinks = profile.socialLinks || {
    linkedin: "",
    twitter: "",
    facebook: "",
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <UniversitySidebar />
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">
                University Profile
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage university details, links and verification status.
              </p>
            </div>

            {/* Profile quick card */}
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
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
            {/* Basic Info */}
            <section className="p-6 border border-gray-100 rounded-xl bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Basic Info
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Core contact details used across the platform.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Warning (shown when basic info is incomplete) */}
                  {showBasicWarning && (
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md">
                      <AlertTriangle className="h-4 w-4" />
                      <div className="text-xs">
                        Complete Basic Info to access the rest of the app.
                      </div>
                      <button
                        onClick={() => setEditSection("basic")}
                        className="ml-2 inline-flex items-center px-2 py-1 bg-yellow-600 text-white rounded-md text-xs hover:bg-yellow-700"
                      >
                        Complete now
                      </button>
                    </div>
                  )}

                  {/* Edit controls */}
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
                  placeholder="University Name"
                />
                <input
                  name="website"
                  value={profile.website || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="Website"
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
                  name="address"
                  value={profile.address || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="Address"
                />
                <input
                  name="location.city"
                  value={location.city || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="City"
                />
                <input
                  name="location.state"
                  value={location.state || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="State"
                />
                <input
                  name="location.country"
                  value={location.country || ""}
                  onChange={handleChange}
                  disabled={editSection !== "basic"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "basic"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="Country"
                />
              </div>
            </section>

            {/* Social Links */}
            <section className="p-6 border border-gray-100 rounded-xl bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Social Links
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Add public links for the university.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {editSection !== "links" ? (
                    <button
                      onClick={() => setEditSection("links")}
                      title="Edit Links"
                      aria-label="Edit Links"
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                    >
                      <Edit2 className="h-5 w-5 text-indigo-600" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSave("links")}
                        title="Save Links"
                        aria-label="Save Links"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <Check className="h-5 w-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => setEditSection(null)}
                        title="Cancel"
                        aria-label="Cancel Links Edit"
                        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {["linkedin", "twitter", "facebook"].map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-50 border">
                      <LinkIcon className="h-4 w-4 text-gray-500" />
                    </span>
                    <input
                      name={`socialLinks.${s}`}
                      value={socialLinks[s] || ""}
                      onChange={handleChange}
                      disabled={editSection !== "links"}
                      className={`flex-1 border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                        editSection === "links"
                          ? "border-indigo-300"
                          : "border-gray-200 opacity-95"
                      }`}
                      placeholder={s}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Other Details */}
            <section className="p-6 border border-gray-100 rounded-xl bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Other Details
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Description, admin and verification.
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
                  name="description"
                  value={profile.description || ""}
                  onChange={handleChange}
                  disabled={editSection !== "other"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "other"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  rows={4}
                  placeholder="Description"
                />
                <input
                  name="adminName"
                  value={profile.adminName || ""}
                  onChange={handleChange}
                  disabled={editSection !== "other"}
                  className={`w-full border p-3 rounded-md bg-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 ${
                    editSection === "other"
                      ? "border-indigo-300"
                      : "border-gray-200 opacity-95"
                  }`}
                  placeholder="Admin Name"
                />
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="verified"
                    checked={profile.verified || false}
                    onChange={handleChange}
                    disabled={editSection !== "other"}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-indigo-200"
                  />
                  <span className="text-sm text-gray-700">Verified</span>
                </label>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UniversityProfile;
