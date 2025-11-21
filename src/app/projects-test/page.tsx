"use client";

import { useEffect, useState } from "react";
import { fetchProjects, createProject } from "../../lib/api";


type Project = {
  id: string;
  name: string;
  description: string;
};

export default function ProjectsTestPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then((data) => setProjects(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const newProject = await createProject({ name, description });
      setProjects((prev) => [...prev, newProject]);
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    }
  }

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Projects Test</h1>

      {loading && <p>Loading projects...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong>
            {p.description ? ` — ${p.description}` : null}
          </li>
        ))}
      </ul>

      <form onSubmit={handleCreate} style={{ marginTop: "1rem" }}>
        <div>
          <label>
            Name:{" "}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <label>
            Description:{" "}
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" style={{ marginTop: "0.5rem" }}>
          Add project
        </button>
      </form>
    </main>
  );
}
