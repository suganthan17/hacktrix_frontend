import React from "react";
import Button from "./Button";
import { Github, ExternalLink, Trash2, Bookmark } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ProjectCard({
  id,
  _id,
  name = "Untitled",
  description,
  technologies = [],
  githubUrl,
  liveUrl,
  stars,
  onDelete,
  isSaved = false,
  onToggleSave,
}) {
  const projectId = id || _id || "";

  const handleDelete = () => {
    const confirmed = typeof window !== "undefined" ? window.confirm(`Delete "${name}"?`) : true;
    if (!confirmed) return;

    if (!projectId) {
      toast.error("Unable to delete: missing id");
      return;
    }

    if (typeof onDelete === "function") onDelete(projectId);
    toast.success("Project removed");
  };

  const handleToggleSave = () => {
    if (typeof onToggleSave === "function") {
      onToggleSave(projectId);
      toast.success(isSaved ? "Removed from saved" : "Saved project");
    }
  };

  return (
    <article
      className="bg-[var(--card-bg)] dark:bg-[hsl(var(--card))] rounded-lg p-6 shadow-card hover:shadow-lg transition transform hover:-translate-y-1 h-full flex flex-col"
      aria-labelledby={`project-${projectId}-title`}
      role="article"
    >
      {/* Top: title + optional stars */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            id={`project-${projectId}-title`}
            className="text-lg font-semibold leading-tight truncate text-slate-900"
            title={name}
          >
            {name}
          </h3>

          {description && (
            <p className="text-sm mt-2 line-clamp-3 text-slate-700">
              {description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {technologies.map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800"
                title={t}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {typeof stars === "number" && (
          <div className="ml-3 shrink-0 text-sm text-slate-700" aria-hidden>
            {stars} ★
          </div>
        )}
      </header>

      {/* Spacer grows to push footer to bottom */}
      <div className="mt-4 flex-1" />

      {/* Footer: actions */}
      <footer className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800 text-white text-sm cursor-pointer"
              aria-label={`Open ${name} repository`}
            >
              <Github className="w-4 h-4" /> <span>Code</span>
            </a>
          )}

          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white text-sm cursor-pointer"
              aria-label={`Open ${name} demo`}
            >
              <ExternalLink className="w-4 h-4" /> <span>Demo</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save / Unsave Button */}
          <Button
            variant={isSaved ? "default" : "ghost"}
            size="sm"
            onClick={handleToggleSave}
            className={`flex items-center gap-1 ${isSaved ? "bg-yellow-400 text-black" : "text-slate-600 hover:text-yellow-600"}`}
            aria-label={isSaved ? `Unsave ${name}` : `Save ${name}`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">
              {isSaved ? "Saved" : "Save"}
            </span>
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-600"
            aria-label={`Delete ${name}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </article>
  );
}
