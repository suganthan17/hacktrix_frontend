// src/components/GitHubImport.jsx
import React, { useState } from "react";
import Button from "./Button";
import { Github, Loader2 } from "lucide-react";
import { useProjects } from "../context/ProjectsContext";
import { toast } from "react-hot-toast";

export default function GitHubImport({ onImport }) {
  const { importProjects } = useProjects();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!username.trim()) {
      toast.error("Enter a GitHub username");
      return;
    }
    setLoading(true);
    try {
      // mock fetch
      await new Promise((r) => setTimeout(r, 900));
      const mockProjects = [
        { name: `${username}'s Project 1`, description: "Cool project", technologies: ["React"], githubUrl: `https://github.com/${username}/p1`, stars: Math.floor(Math.random() * 200) },
        { name: `${username}'s Project 2`, description: "Another project", technologies: ["Node"], githubUrl: `https://github.com/${username}/p2`, stars: Math.floor(Math.random() * 200) },
      ];
      const added = importProjects(mockProjects);
      toast.success(`Imported ${added.length} projects`);
      setUsername("");
      if (onImport) onImport(added);
    } catch (err) {
      console.error(err);
      toast.error("Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 bg-[var(--card-bg)] rounded shadow">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Github className="w-5 h-5 text-gray-500" />
          <input placeholder="GitHub username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleImport()} className="flex-1 px-2 py-1 border rounded" />
        </div>
        <Button onClick={handleImport} className="px-3 py-1">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</> : "Import"}
        </Button>
      </div>
    </div>
  );
}
