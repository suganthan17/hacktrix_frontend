import React, { useEffect, useRef, useState } from "react";
import Button from "./Button";
import { Plus, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AddProjectModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tech, setTech] = useState("");
  const [techs, setTechs] = useState([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const wrapperRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setTech("");
      setTechs([]);
      setGithubUrl("");
      setLiveUrl("");
    } else {
      // autofocus name input when opened
      setTimeout(() => nameRef.current?.focus?.(), 50);
    }
  }, [isOpen]);

  // lock scroll when modal open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // click outside to close
  const onBackgroundClick = (e) => {
    if (e.target === wrapperRef.current) onClose();
  };

  const addTech = () => {
    const t = (tech || "").trim();
    if (!t) return;
    setTechs((s) => (s.includes(t) ? s : [...s, t]));
    setTech("");
  };

  const submit = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!name.trim() || !description.trim()) {
      return toast.error("Name and description required");
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      technologies: techs,
      ...(githubUrl.trim() ? { githubUrl: githubUrl.trim() } : {}),
      ...(liveUrl.trim() ? { liveUrl: liveUrl.trim() } : {}),
    };

    try {
      if (typeof onCreate === "function") onCreate(payload);
      toast.success("Project added");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add project");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={wrapperRef}
      onMouseDown={onBackgroundClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-project-title"
        className="bg-[var(--card-bg)] rounded-lg p-6 w-full max-w-2xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="add-project-title" className="text-lg font-semibold">
            Add Project
          </h3>
          <button onClick={onClose} aria-label="Close" className="p-1 text-gray-600 hover:text-black">
            <X />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Project name</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Technologies</label>
            <div className="flex gap-2">
              <input
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
                className="flex-1 px-3 py-2 border rounded"
                placeholder="React, Node..."
              />
              <Button variant="outline" size="sm" type="button" onClick={addTech}>
                <Plus />
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {techs.map((t) => (
                <span key={t} className="px-2 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                  {t}
                  <button
                    type="button"
                    onClick={() => setTechs((s) => s.filter((x) => x !== t))}
                    className="text-xs ml-1"
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Repository URL (optional)</label>
            <input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="https://github.com/your/repo"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Live demo URL (optional)</label>
            <input
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="https://your-app.example.com"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
