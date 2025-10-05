// src/context/ProjectsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const ProjectsContext = createContext();

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState(() => {
    try {
      const raw = localStorage.getItem("mentor_projects");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem("mentor_saved_projects");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // persist projects and savedIds
  useEffect(() => {
    localStorage.setItem("mentor_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("mentor_saved_projects", JSON.stringify(savedIds));
  }, [savedIds]);

  // CRUD-ish helpers
  const addProject = (payload) => {
    // ensure id exists
    const id = payload.id || payload._id || Math.random().toString(36).slice(2, 9);
    const newProject = { ...payload, id };
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };

  const importProjects = (items = []) => {
    // normalize items to have id
    const normalized = items.map((it) => ({ ...it, id: it.id || it._id || Math.random().toString(36).slice(2, 9) }));
    setProjects((prev) => [...normalized, ...prev]);
  };

  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => (p.id || p._id) !== id));
    // also remove from savedIds if present
    setSavedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const toggleSaveProject = (id) => {
    setSavedIds((prev) => {
      if (prev.includes(id)) return prev.filter((sid) => sid !== id);
      return [...prev, id];
    });
  };

  const resetKeepSaved = () => {
    setProjects((prev) => prev.filter((p) => savedIds.includes(p.id || p._id)));
    // optionally clear savedIds that no longer exist
    setSavedIds((prev) => prev.filter((sid) => (projects.some(p => (p.id||p._id) === sid))));
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        savedIds,
        addProject,
        importProjects,
        deleteProject,
        toggleSaveProject,
        resetKeepSaved,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export const useProjects = () => useContext(ProjectsContext);
