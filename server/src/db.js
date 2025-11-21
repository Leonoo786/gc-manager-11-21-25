// Very simple in-memory "database" to get us started.
// Later we can replace this with a real DB (Postgres, Mongo, etc.)

let projects = [];
let nextId = 1;

function getAllProjects() {
  return projects;
}

function getProject(id) {
  return projects.find(p => p.id === id) || null;
}

function createProject(data) {
  const project = {
    id: String(nextId++),
    name: data.name || "Untitled project",
    description: data.description || "",
    // add whatever other fields you need later
  };
  projects.push(project);
  return project;
}

function updateProject(id, data) {
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;

  projects[index] = {
    ...projects[index],
    ...data,
    id // never let the id change
  };

  return projects[index];
}

function deleteProject(id) {
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return false;
  projects.splice(index, 1);
  return true;
}

module.exports = {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
};
