// src/components/GithubSearchBar.jsx
import React, { useState } from "react";
import { Search } from "lucide-react";

export default function GithubSearchBar({ onSearch, placeholder = "GitHub username" }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e?.preventDefault();
    const username = value.trim();
    if (!username) return;
    onSearch?.(username);
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search size={14} />
        </span>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-3 py-2 w-56 md:w-72 rounded-md bg-white border border-slate-200 shadow-sm text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          aria-label="GitHub username"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium shadow-sm hover:opacity-95 cursor-pointer"
      >
        Search
      </button>
    </form>
  );
}
