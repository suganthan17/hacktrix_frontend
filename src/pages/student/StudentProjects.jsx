// src/pages/student/StudentProjects.jsx
import React, { useState } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import DashboardHeader from "../../components/DashboardHeader";
import { useProjects } from "../../context/ProjectsContext";
import ProjectCard from "../../components/ProjectCard";
import AddProjectModal from "../../components/AddProjectModal";
import GitHubImport from "../../components/GitHubImport";
import Button from "../../components/Button";
import { Plus } from "lucide-react";
import GithubSearchBar from "../../components/GithubSearchBar";

export default function StudentProjects() {
  const {
    projects = [],
    savedIds = [],
    addProject,
    importProjects,
    deleteProject,
    toggleSaveProject,
    resetKeepSaved,
  } = useProjects() || {};

  const [isAddOpen, setAddOpen] = useState(false);
  const [importUsername, setImportUsername] = useState(null);

  function handleGithubSearch(username) {
    setImportUsername(username);
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <StudentSidebar />

      <main className="flex-1 p-6">
        <DashboardHeader title="My Projects" />

        {/* Header row */}
        <div className="mt-6 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Projects</h2>
            <p className="text-sm text-gray-600">Manage and share your work</p>
          </div>

          <div className="flex items-center gap-3">
            <GithubSearchBar onSearch={handleGithubSearch} />

            <Button variant="gradient" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" /> Add Project
            </Button>

            {/* Reset button */}
            <Button
              variant="outline"
              onClick={() => {
                // confirm might be desirable
                const proceed = window.confirm(
                  "Reset will remove all unsaved projects. Saved projects will remain. Continue?"
                );
                if (proceed && typeof resetKeepSaved === "function") resetKeepSaved();
              }}
            >
              Reset (keep saved)
            </Button>
          </div>
        </div>

        {/* Projects area */}
        <section>
          {!projects || projects.length === 0 ? (
            <div className="bg-[var(--card-bg)] p-8 rounded-lg shadow">
              <p className="text-center text-gray-600">No projects yet — add your first project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p) => {
                const key = p.id || p._id || p.name || Math.random().toString(36).slice(2, 9);
                const id = p.id || p._id;
                const isSaved = savedIds.includes(id);

                return (
                  <div key={key} className="h-full">
                    <ProjectCard
                      {...p}
                      isSaved={isSaved}
                      onToggleSave={() => {
                        if (id && typeof toggleSaveProject === "function") toggleSaveProject(id);
                      }}
                      onDelete={() => {
                        if (id && typeof deleteProject === "function") deleteProject(id);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Add Project modal */}
        <AddProjectModal
          isOpen={isAddOpen}
          onClose={() => setAddOpen(false)}
          onCreate={(payload) => {
            if (typeof addProject === "function") addProject(payload);
            setAddOpen(false);
          }}
        />

        {/* GitHub import modal: opens only when search is submitted */}
        {importUsername && (
          <GitHubImport
            username={importUsername}
            onClose={() => setImportUsername(null)}
            onImport={(items) => {
              if (typeof importProjects === "function") importProjects(items);
              setImportUsername(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
