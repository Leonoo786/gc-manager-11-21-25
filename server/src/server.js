const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ----- Projects endpoints -----

// GET /api/projects  -> list all projects
app.get("/api/projects", (req, res) => {
  res.json(getAllProjects());
});

// GET /api/projects/:id -> get one project
app.get("/api/projects/:id", (req, res) => {
  const project = getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json(project);
});

// POST /api/projects -> create a new project
app.post("/api/projects", (req, res) => {
  const project = createProject(req.body || {});
  res.status(201).json(project);
});

// PATCH /api/projects/:id -> update an existing project
app.patch("/api/projects/:id", (req, res) => {
  const updated = updateProject(req.params.id, req.body || {});
  if (!updated) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json(updated);
});

// DELETE /api/projects/:id -> delete a project
app.delete("/api/projects/:id", (req, res) => {
  const ok = deleteProject(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.status(204).end();
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
