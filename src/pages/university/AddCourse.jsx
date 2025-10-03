// src/pages/university/CreateCourseQuizModern.jsx
import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { BASE_URL } from "../../config";
import UniversitySidebar from "../../components/UniversitySidebar";

export default function CreateCourseQuizModern() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    duration: "",
    startDate: "",
    endDate: "",
  });
  const [video, setVideo] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [questions, setQuestions] = useState([
    { questionText: "", options: ["", "", "", ""], correctIndex: 0, marks: 1 },
  ]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!video) {
      setVideoURL(null);
      return;
    }
    const url = URL.createObjectURL(video);
    setVideoURL(url);
    return () => URL.revokeObjectURL(url);
  }, [video]);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setVideo(f || null);
  };

  const addQuestionField = () =>
    setQuestions((p) => [
      ...p,
      { questionText: "", options: ["", "", "", ""], correctIndex: 0, marks: 1 },
    ]);

  const removeQuestionField = (idx) =>
    setQuestions((p) => {
      const copied = p.filter((_, i) => i !== idx);
      return copied.length
        ? copied
        : [{ questionText: "", options: ["", "", "", ""], correctIndex: 0, marks: 1 }];
    });

  const updateQuestionText = (idx, value) =>
    setQuestions((p) => {
      const c = [...p];
      c[idx] = { ...c[idx], questionText: value };
      return c;
    });

  const updateOption = (qIdx, oIdx, value) =>
    setQuestions((p) => {
      const c = [...p];
      const options = [...c[qIdx].options];
      options[oIdx] = value;
      c[qIdx] = { ...c[qIdx], options };
      return c;
    });

  const setCorrectIndex = (qIdx, oIdx) =>
    setQuestions((p) => {
      const c = [...p];
      c[qIdx] = { ...c[qIdx], correctIndex: oIdx };
      return c;
    });

  const updateMarks = (qIdx, value) =>
    setQuestions((p) => {
      const c = [...p];
      const marks = Math.max(1, Math.floor(Number(value) || 1));
      c[qIdx] = { ...c[qIdx], marks };
      return c;
    });

  const resetAll = () => {
    if (!confirm("Reset all fields? This will clear current input.")) return;
    setFormData({ name: "", description: "", category: "", duration: "", startDate: "", endDate: "" });
    setVideo(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
    setQuestions([{ questionText: "", options: ["", "", "", ""], correctIndex: 0, marks: 1 }]);
    setQuizTitle("");
    setQuizDescription("");
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / 1024 / 1024;
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  const validateBeforeSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Course name required");
      return false;
    }
    if (!quizTitle.trim()) {
      toast.error("Quiz title required");
      return false;
    }
    if (!video) {
      toast.error("Please upload a course video");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1} missing text`);
        return false;
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        toast.error(`Question ${i + 1} needs at least 2 options`);
        return false;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          toast.error(`Option ${j + 1} of Q${i + 1} is empty`);
          return false;
        }
      }
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        toast.error(`Set a valid correct option for Question ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const totalMarks = questions.reduce((s, q) => s + Number(q.marks || 0), 0);

  const handleSubmitAll = async (e) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;

    setSubmitting(true);
    try {
      const courseForm = new FormData();
      Object.keys(formData).forEach((k) => courseForm.append(k, formData[k]));
      courseForm.append("video", video);

      const courseRes = await fetch(`${BASE_URL}/api/courses/add`, {
        method: "POST",
        body: courseForm,
        credentials: "include",
      });
      const courseData = await courseRes.json();
      if (!courseRes.ok) throw new Error(courseData.message || "Course create failed");

      const courseId = courseData.course?._id || courseData._id;
      if (!courseId) throw new Error("Course ID missing");

      const quizRes = await fetch(`${BASE_URL}/api/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, title: quizTitle, description: quizDescription }),
      });
      const quizData = await quizRes.json();
      if (!quizRes.ok) throw new Error(quizData.message || "Quiz create failed");

      const quizId = quizData.quiz?._id || quizData._id;
      if (!quizId) throw new Error("Quiz ID missing");

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const optionsPayload = q.options.map((text, idx) => ({ text: text.trim(), isCorrect: idx === q.correctIndex }));
        const addQRes = await fetch(`${BASE_URL}/api/quizzes/${quizId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ questionText: q.questionText.trim(), options: optionsPayload, marks: Number(q.marks || 1) }),
        });
        const addQData = await addQRes.json();
        if (!addQRes.ok) throw new Error(addQData.message || `Failed Q${i + 1}`);
      }

      toast.success("Course, quiz, and questions created 🎉");
      resetAll();
    } catch (err) {
      toast.error(err.message || "Something failed");
    } finally {
      setSubmitting(false);
    }
  };

  // modern visual helpers
  const badge = (text) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-white text-xs font-semibold">
      {text}
    </span>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-100 via-white to-gray-50">
      <UniversitySidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Form area (wide) */}
          <form
            onSubmit={handleSubmitAll}
            className="lg:col-span-3 bg-gradient-to-tr from-white to-slate-50 border border-gray-100 rounded-2xl shadow-xl p-6 space-y-6"
            aria-labelledby="create-course-quiz"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 id="create-course-quiz" className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Create Course + Quiz
                </h1>
                <p className="text-sm text-slate-500 mt-1 max-w-xl">
                  Build a course with an associated quiz — modern, fast workflow.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAll}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg bg-white/80 border border-gray-200 text-sm text-slate-700 hover:bg-white"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm font-semibold shadow-md hover:scale-[1.01] transform transition"
                >
                  {submitting ? "Working..." : "Create Course & Quiz"}
                </button>
              </div>
            </div>

            {/* Course details card */}
            <div className="rounded-2xl bg-gradient-to-b from-white/60 to-white/40 border border-gray-100 p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-xs text-slate-500">Course name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Machine Learning Basics"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-100 bg-white/80"
                    required
                  />

                  <label className="text-xs text-slate-500">Short description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Summarize what students will learn..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-100 bg-white/80"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs text-slate-500">Category</label>
                  <input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Data Science"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-100 bg-white/80"
                  />

                  <label className="text-xs text-slate-500">Duration</label>
                  <input
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g., 8 weeks"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-100 bg-white/80"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-100 bg-white/80"
                />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-100 bg-white/80"
                />
              </div>
            </div>

            {/* Video upload */}
            <div className="rounded-2xl border border-gray-100 p-5 bg-gradient-to-b from-white to-slate-50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Course video</h3>
                  <p className="text-xs text-slate-500">Upload the main course video (used as preview / lesson).</p>
                </div>
                <div className="text-xs text-slate-400">{video ? formatFileSize(video.size) : "No file"}</div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <label
                  htmlFor="video-upload"
                  className="flex-1 cursor-pointer rounded-lg border border-dashed border-gray-200 px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 hover:border-indigo-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-slate-700">{video ? video.name : "Click to select a video"}</div>
                    <div className="text-xs text-slate-500">{video ? formatFileSize(video.size) : "MP4, MOV, ... "}</div>
                  </div>
                  <input ref={fileInputRef} id="video-upload" type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                </label>

                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-indigo-600 text-white shadow">Select file</button>

                {videoURL && (
                  <div className="w-full md:w-64 rounded overflow-hidden border">
                    <video src={videoURL} controls className="w-full h-36 object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Quiz header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Quiz</h2>
                <p className="text-sm text-slate-500">Title, description and questions for the quiz.</p>
              </div>
              <div className="text-sm text-slate-600">Questions: <span className="font-medium">{questions.length}</span> • Marks: <span className="font-medium">{totalMarks}</span></div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-5 bg-white/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Quiz title"
                  className="rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Quiz short description (optional)"
                  className="rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-slate-500">Questions list</div>
                <button type="button" onClick={addQuestionField} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm shadow">+ Add Question</button>
              </div>

              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <div key={qi} className="bg-gradient-to-r from-white to-slate-50 border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        <input
                          value={q.questionText}
                          onChange={(e) => updateQuestionText(qi, e.target.value)}
                          placeholder={`Question ${qi + 1}`}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 mb-3 focus:ring-2 focus:ring-indigo-100"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <label key={oi} className="flex items-center gap-3 bg-white border border-gray-100 rounded-md px-3 py-2">
                              <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => setCorrectIndex(qi, oi)} />
                              <input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 border-0 focus:ring-0" />
                              {q.correctIndex === oi && <span className="ml-2 text-xs text-emerald-700 font-semibold">Correct</span>}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="w-36 flex flex-col items-end gap-2">
                        <div className="text-xs text-slate-500">Marks</div>
                        <input type="number" min="1" value={q.marks} onChange={(e) => updateMarks(qi, e.target.value)} className="w-full rounded-md border border-gray-200 px-2 py-2 text-center" />
                        <button type="button" onClick={() => removeQuestionField(qi)} className="mt-2 w-full px-3 py-1 rounded-lg bg-rose-600 text-white text-sm">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Right preview / tips (narrow) */}
          <aside className="sticky top-20 h-fit rounded-2xl p-5 bg-gradient-to-b from-indigo-600 to-blue-500 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Live Preview</h3>
                <p className="text-xs text-indigo-100 mt-1">Quick check before publishing</p>
              </div>
              <div className="text-sm text-indigo-100/80">{badge("Live")}</div>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <div className="text-xs opacity-80">Course</div>
                <div className="mt-1 font-semibold text-white">{formData.name || "—"}</div>
                <div className="text-xs opacity-80">{formData.category || "No category"}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs opacity-80">Start</div>
                  <div className="mt-1 text-white">{formData.startDate || "—"}</div>
                </div>
                <div>
                  <div className="text-xs opacity-80">End</div>
                  <div className="mt-1 text-white">{formData.endDate || "—"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs opacity-80">Quiz</div>
                <div className="mt-1 font-semibold text-white">{quizTitle || "—"}</div>
                <div className="text-xs opacity-80">{quizDescription || "No description"}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs opacity-80">Questions</div>
                  <div className="mt-1 text-white">{questions.length}</div>
                </div>
                <div>
                  <div className="text-xs opacity-80">Total marks</div>
                  <div className="mt-1 text-white">{totalMarks}</div>
                </div>
              </div>

              <div>
                <div className="text-xs opacity-80">Video</div>
                <div className="mt-1 text-white">{video ? `${video.name} · ${formatFileSize(video.size)}` : "No video"}</div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => document.querySelector("form")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-medium"
                >
                  Jump to form
                </button>
              </div>
            </div>

            <div className="mt-6 text-xs text-indigo-100/80">
              Tip: Use the preview to verify the course title, dates and quiz before creating.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
