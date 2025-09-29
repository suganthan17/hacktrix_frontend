import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { BASE_URL } from "../../config";
import UniversitySidebar from "../../components/UniversitySidebar";

export default function AddCourseAlternate() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    duration: "",
    startDate: "",
    endDate: "",
  });
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => setVideo(e.target.files[0]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      duration: "",
      startDate: "",
      endDate: "",
    });
    setVideo(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video) {
      toast.error("Please upload a video");
      return;
    }

    const form = new FormData();
    Object.keys(formData).forEach((key) => form.append(key, formData[key]));
    form.append("video", video);

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/courses/add`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      toast.success("Course added successfully 🎉");
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <UniversitySidebar />

      <main className="flex-1 p-6 lg:p-12">
        <div className="max-w-3xl mx-auto">
          <section className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">
                Add New Course
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-slate-600">Course name</span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Machine Learning Basics"
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-slate-600">Category</span>
                  <input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Data Science"
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-slate-600">Description</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  placeholder="Short course overview — what students will learn."
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-xs text-slate-600">Duration</span>
                  <input
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g. 8 weeks"
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-slate-600">Start date</span>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-slate-600">End date</span>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </label>
              </div>

              <div>
                <span className="text-xs text-slate-600">Course video</span>

                <div className="mt-2 flex items-center gap-3">
                  <label
                    htmlFor="video"
                    className="flex-1 cursor-pointer rounded-lg border border-dashed border-slate-200 px-4 py-3 text-sm bg-slate-50 hover:border-indigo-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-slate-700">
                        {video ? video.name : "Choose or drop a video file"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Max size depends on server
                      </div>
                    </div>
                    <input
                      id="video"
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <div className="w-40 text-right">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-md bg-indigo-600 text-white py-2 text-sm"
                    >
                      Select file
                    </button>
                  </div>
                </div>

                {video && (
                  <div className="mt-3 rounded-md overflow-hidden border">
                    <video
                      className="w-full"
                      src={URL.createObjectURL(video)}
                      controls
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-slate-500">
                  You can reset the form anytime.
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md px-4 py-2 border text-sm"
                    disabled={loading}
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 text-white px-5 py-2 font-medium shadow-sm"
                    disabled={loading}
                  >
                    {loading ? "Uploading..." : "Add Course"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
