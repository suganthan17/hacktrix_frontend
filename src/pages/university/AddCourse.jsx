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
      {
        questionText: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        marks: 1,
      },
    ]);

  const removeQuestionField = (idx) =>
    setQuestions((p) => p.filter((_, i) => i !== idx));

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
      c[qIdx] = { ...c[qIdx], marks: Number(value) || 1 };
      return c;
    });

  const resetAll = () => {
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
    setQuestions([
      {
        questionText: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        marks: 1,
      },
    ]);
    setQuizTitle("");
    setQuizDescription("");
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Course name required");
    if (!quizTitle.trim()) return toast.error("Quiz title required");
    if (!video) return toast.error("Please upload a course video");

    setSubmitting(true);
    try {
      // 1️⃣ Create course
      const courseForm = new FormData();
      Object.keys(formData).forEach((k) => courseForm.append(k, formData[k]));
      courseForm.append("video", video);

      const courseRes = await fetch(`${BASE_URL}/api/courses/add`, {
        method: "POST",
        body: courseForm,
        credentials: "include",
      });
      const courseData = await courseRes.json();
      if (!courseRes.ok)
        throw new Error(courseData.message || "Course create failed");

      const courseId = courseData.course?._id || courseData._id;
      if (!courseId) throw new Error("Course ID missing");

      // 2️⃣ Create quiz
      const quizRes = await fetch(`${BASE_URL}/api/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId,
          title: quizTitle,
          description: quizDescription,
        }),
      });
      const quizData = await quizRes.json();
      if (!quizRes.ok)
        throw new Error(quizData.message || "Quiz create failed");

      const quizId = quizData.quiz?._id || quizData._id;
      if (!quizId) throw new Error("Quiz ID missing");

      // 3️⃣ Add questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const optionsPayload = q.options.map((text, idx) => ({
          text: text.trim(),
          isCorrect: idx === q.correctIndex,
        }));

        const addQRes = await fetch(
          `${BASE_URL}/api/quizzes/${quizId}/questions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              questionText: q.questionText.trim(),
              options: optionsPayload,
              marks: Number(q.marks || 1),
            }),
          }
        );

        const addQData = await addQRes.json();
        if (!addQRes.ok)
          throw new Error(addQData.message || `Failed Q${i + 1}`);
      }

      toast.success("Course, quiz, and questions created 🎉");
      resetAll();
    } catch (err) {
      toast.error(err.message || "Something failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UniversitySidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form
            onSubmit={handleSubmitAll}
            className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-gray-100 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  Create Course + Quiz
                </h1>
                <p className="text-sm text-slate-500">
                  Add course, quiz and questions in one go.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetAll}
                  disabled={submitting}
                  className="px-3 py-2 rounded-md border text-sm text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm"
                >
                  {submitting ? "Submitting..." : "Create All"}
                </button>
              </div>
            </div>

            {/* Course inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600">Course name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Machine Learning Basics"
                  className="mt-2 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">Category</label>
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Data Science"
                  className="mt-2 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600">
                Short description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="What students will learn..."
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="Duration (e.g., 8 weeks)"
                className="rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
              />
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
              />
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Video upload */}
            <div>
              <label className="text-xs text-slate-600">Course video</label>
              <div className="mt-3 flex items-center gap-4">
                <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-gray-200 px-4 py-3 bg-gray-50 hover:border-indigo-300 transition">
                  <div className="flex items-center justify-between">
                    <div className="text-slate-700">
                      {video ? video.name : "Upload a course video"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {video
                        ? `${(video.size / 1024 / 1024).toFixed(2)} MB`
                        : "Max size depends on server"}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                >
                  Select file
                </button>
              </div>
              {videoURL && (
                <div className="mt-3 rounded-md overflow-hidden border">
                  <video className="w-full" src={videoURL} controls />
                </div>
              )}
            </div>

            {/* Quiz + Questions */}
            <div className="pt-4 border-t">
              <h2 className="text-lg font-medium mb-3">Quiz</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Quiz title"
                  className="rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Quiz short description (optional)"
                  className="rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium">Questions</h2>
                <button
                  type="button"
                  onClick={addQuestionField}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <div
                    key={qi}
                    className="bg-gray-50 border border-gray-100 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <input
                          value={q.questionText}
                          onChange={(e) =>
                            updateQuestionText(qi, e.target.value)
                          }
                          placeholder={`Question ${qi + 1}`}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 mb-3 focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <label
                              key={oi}
                              className="flex items-center gap-3 bg-white border border-gray-100 rounded-md px-3 py-2"
                            >
                              <input
                                type="radio"
                                name={`correct-${qi}`}
                                checked={q.correctIndex === oi}
                                onChange={() => setCorrectIndex(qi, oi)}
                              />
                              <input
                                value={opt}
                                onChange={(e) =>
                                  updateOption(qi, oi, e.target.value)
                                }
                                placeholder={`Option ${oi + 1}`}
                                className="flex-1 border-0 focus:ring-0"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="w-28 text-right">
                        <div className="text-xs text-slate-500 mb-2">Marks</div>
                        <input
                          type="number"
                          min="1"
                          value={q.marks}
                          onChange={(e) => updateMarks(qi, e.target.value)}
                          className="w-full rounded-md border border-gray-200 px-2 py-2 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => removeQuestionField(qi)}
                          className="mt-3 w-full px-2 py-1 bg-red-500 text-white rounded-md text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
