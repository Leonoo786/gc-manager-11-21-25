"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { projectsData } from "./projects-data";
import type { Project } from "./projects-data";

const STORAGE_KEY = "projects";

type StatusFilter = "all" | Project["status"];

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  // ---------- INITIAL LOAD (localStorage → fallback to projectsData) ----------
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Project[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
          setIsLoaded(true);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to read projects from localStorage:", err);
    }

    // Fallback: use template data
    setProjects(projectsData);
    setIsLoaded(true);
  }, []);

  // ---------- SAVE TO LOCALSTORAGE ----------
  React.useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
      console.error("Failed to save projects to localStorage:", err);
    }
  }, [projects, isLoaded]);

  // ---------- SNAPSHOT: SAVE TO SUPABASE ----------
  const handleSaveSnapshot = async () => {
    try {
      const res = await fetch("/api/snapshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projects }),
      });

      if (!res.ok) {
        console.error("Snapshot save failed with status", res.status);
        alert("Could not save snapshot to cloud.");
        return;
      }

      const data = await res.json();
      console.log("Snapshot save response:", data);
      alert(`Saved snapshot with ${projects.length} project(s) to the cloud.`);
    } catch (err) {
      console.error("Failed to save snapshot:", err);
      alert("Something went wrong saving the snapshot.");
    }
  };

  // ---------- SNAPSHOT: LOAD FROM SUPABASE ----------
  const handleLoadLatestSnapshot = async () => {
    try {
      const res = await fetch("/api/snapshot");
      if (!res.ok) {
        console.error("Snapshot request failed", res.status);
        alert("Could not load snapshot from cloud.");
        return;
      }

      const data = await res.json();
      console.log("Snapshot load raw data:", data);

      const snapshot = data?.snapshot;
      const snapshotProjects = snapshot?.projects;

      if (!Array.isArray(snapshotProjects)) {
        alert(
          "No valid snapshot found in the cloud. Keeping your current projects."
        );
        return;
      }

      if (snapshotProjects.length === 0) {
        alert(
          "Latest snapshot has 0 projects, so I'm keeping your current projects.\n\nClick 'Save Snapshot to Cloud' after you see the projects you want to store."
        );
        return;
      }

      setProjects(snapshotProjects as Project[]);
      alert(`Loaded snapshot with ${snapshotProjects.length} project(s).`);
    } catch (err) {
      console.error("Failed to load snapshot:", err);
      alert("Something went wrong loading the snapshot. Keeping current projects.");
    }
  };

  // ---------- FILTERED PROJECTS ----------
  const visibleProjects = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return projects.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }

      if (!term) return true;

      const fieldsToSearch = [
        project.name,
        project.client,
        project.city ?? "",
        project.zipCode ?? "",
      ];

      return fieldsToSearch.some((field) =>
        field.toLowerCase().includes(term)
      );
    });
  }, [projects, searchTerm, statusFilter]);

  // ---------- UI ----------
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-2xl font-semibold">Projects</h1>
            <p className="text-sm text-slate-500">
              Overview of all active and completed jobs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              Save Snapshot to Cloud
            </button>
            <button
              type="button"
              onClick={handleLoadLatestSnapshot}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              Load Latest Snapshot
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white px-3 py-3">
          {/* Search */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              placeholder="Search by project name, client, city, or zip"
            />
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-48">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="w-full rounded-md border px-2 py-1.5 text-sm bg-white"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Planning">Planning</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        {/* Projects grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.length === 0 ? (
            <div className="col-span-full rounded-lg border bg-white px-4 py-6 text-sm text-slate-500">
              No projects found. Try adjusting your filters or add a new project.
            </div>
          ) : (
            visibleProjects.map((project) => {
              const finalBid = project.finalBid ?? project.budget;
              const spent = project.spent;
              const remaining = Math.max(finalBid - spent, 0);
              const percentSpent =
                finalBid > 0
                  ? Math.min(Math.round((spent / finalBid) * 100), 999)
                  : 0;
              const profitLoss = finalBid - spent; // positive = under budget

              const locationParts = [project.city, project.zipCode].filter(
                Boolean
              );
              const location = locationParts.join(" ");

              const statusColor =
                project.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : project.status === "Planning"
                  ? "bg-amber-100 text-amber-700"
                  : project.status === "Completed"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-purple-100 text-purple-700"; // On Hold

              return (
                <article
                  key={project.id}
                  className="flex h-full flex-col overflow-hidden rounded-lg border bg-white"
                >
                  {/* Card header */}
                  <div className="border-b bg-slate-50 px-4 py-3 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Project
                      </div>
                      <div className="text-sm font-semibold leading-tight">
                        {project.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {location && <span>{location}</span>}
                      </div>
                    </div>

                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium " +
                        statusColor
                      }
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="flex-1 px-4 py-3 space-y-3">
                    {/* Client */}
                    <div className="text-xs text-slate-500">
                      Client:{" "}
                      <span className="font-medium text-slate-800">
                        {project.client}
                      </span>
                    </div>

                    {/* Budget summary */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Budget</span>
                        <span>
                          ${finalBid.toLocaleString()}{" "}
                          <span className="text-slate-400">Final Bid</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Spent</span>
                        <span>${spent.toLocaleString()}</span>
                      </div>

                      {/* Progress bar (budget used) */}
                      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-sky-500"
                          style={{
                            width: `${Math.min(percentSpent, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                        <span>{percentSpent}% of budget used</span>
                        <span>
                          Remaining: ${remaining.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Overall project progress */}
                    <div className="space-y-1 pt-1 border-t border-dashed border-slate-200 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Overall Progress
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{
                            width: `${Math.min(project.progress, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Profit / Loss */}
                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200 mt-2">
                      <span className="text-xs text-slate-500">
                        Profit / Loss
                      </span>
                      <span
                        className={
                          "text-xs font-semibold " +
                          (profitLoss > 0
                            ? "text-green-600"
                            : profitLoss < 0
                            ? "text-red-600"
                            : "text-slate-700")
                        }
                      >
                        {profitLoss >= 0 ? "+" : "-"}$
                        {Math.abs(profitLoss).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="border-t bg-slate-50 px-4 py-2 flex items-center justify-between">
                    <button
                      type="button"
                      className="text-xs font-medium text-sky-700 hover:underline"
                    >
                      View Details
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Start: {project.startDate} · End: {project.endDate}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
