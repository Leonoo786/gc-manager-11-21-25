'use client';

import * as React from 'react';
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

import { projectsData } from './projects-data';
import type { Project } from './projects-data';

const STORAGE_KEY = 'projects';

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // -------------------- INITIAL LOAD (localStorage + template) --------------------
  React.useEffect(() => {
    let isCancelled = false;

    function loadProjects() {
      let localProjects: Project[] = [];

      // 1) Try localStorage
      try {
        if (typeof window !== 'undefined') {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) {
            localProjects = JSON.parse(saved) as Project[];
          }
        }
      } catch (err) {
        console.error('Failed to read projects from localStorage:', err);
      }

      // 2) Fallback to projectsData if nothing in localStorage
      const baseProjects =
        localProjects.length > 0
          ? localProjects
          : (projectsData as Project[]);

      if (!isCancelled) {
        setProjects(baseProjects);
        setIsMounted(true);
      }
    }

    loadProjects();

    return () => {
      isCancelled = true;
    };
  }, []);

  // -------------------- PERSIST TO LOCALSTORAGE --------------------
  React.useEffect(() => {
    if (!isMounted) return;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      }
    } catch (err) {
      console.error('Failed to save projects to localStorage:', err);
    }
  }, [projects, isMounted]);

  // -------------------- SNAPSHOT: SAVE TO SUPABASE --------------------
  const handleSaveSnapshot = async () => {
  try {
    console.log("Saving snapshot with", projects.length, "projects");

    const res = await fetch("/api/snapshot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projects,
      }),
    });

    if (!res.ok) {
      console.error("Snapshot save failed with status", res.status);
      alert("Could not save snapshot to cloud.");
      return;
    }

    const data = await res.json();
    console.log("Snapshot save response:", data);

    alert(`Saved snapshot with ${projects.length} project(s).`);
  } catch (err) {
    console.error("Failed to save snapshot:", err);
    alert("Something went wrong saving the snapshot.");
  }
};


  // -------------------- SNAPSHOT: LOAD FROM SUPABASE --------------------
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

    // Try different possible shapes:
    let snapshotProjects: unknown = null;

    if (Array.isArray((data as any)?.projects)) {
      snapshotProjects = (data as any).projects;
    } else if (Array.isArray((data as any)?.snapshot?.projects)) {
      snapshotProjects = (data as any).snapshot.projects;
    } else if (Array.isArray((data as any)?.[0]?.projects)) {
      snapshotProjects = (data as any)[0].projects;
    }

    if (!Array.isArray(snapshotProjects)) {
      console.warn("No valid snapshot data found.");
      alert(
        "No valid snapshot found in the cloud. Keeping your current projects."
      );
      return;
    }

    if (snapshotProjects.length === 0) {
      console.warn("Snapshot has 0 projects; keeping existing projects.");
      alert(
        "Latest snapshot has 0 projects, so I'm keeping your current projects.\n\nClick 'Save Snapshot to Cloud' after you see the projects you want to store."
      );
      return;
    }

    // ✅ Real data: update state
    setProjects(snapshotProjects as Project[]);
    alert(`Loaded snapshot with ${snapshotProjects.length} project(s).`);
  } catch (err) {
    console.error("Failed to load snapshot:", err);
    alert("Something went wrong loading the snapshot. Keeping current projects.");
  }
};


  // -------------------- FILTERED PROJECTS FOR DISPLAY --------------------
  const filteredProjects = React.useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return projects.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search) ||
        p.client.toLowerCase().includes(search);

      const status = (p.status ?? '').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  return (

    <AppShell>
    <div className="flex flex-col gap-8">
      {/* HEADER + SNAPSHOT BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all your projects, then save/load snapshots to the cloud.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveSnapshot}
          >
            Save Snapshot to Cloud
          </Button>
          <button
  onClick={handleLoadLatestSnapshot}
  className="btn ..."
>
  Load Latest Snapshot
</button>

        </div>
      </div>

      {/* SEARCH + FILTER ROW */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <Input
            placeholder="Search by project name or client…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-[180px]">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PROJECT LIST */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No projects match your filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const bid =
              typeof project.finalBidToCustomer === 'number'
                ? project.finalBidToCustomer
                : 0;

            return (
              <Card
  key={project.id}
  className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200"
>
  {/* Header strip */}
  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-300/80">
        Project
      </p>
      <h3 className="text-lg font-semibold text-white leading-tight">
        {project.name}
      </h3>
      <p className="text-xs text-slate-200/80 mt-0.5">
        {project.client || "Client not set"}
      </p>
    </div>

    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        project.status === "Completed"
          ? "bg-emerald-100 text-emerald-700"
          : project.status === "On Hold"
          ? "bg-amber-100 text-amber-700"
          : "bg-sky-100 text-sky-700"
      )}
    >
      {project.status || "Active"}
    </span>
  </div>

  {/* Body */}
  <div className="px-4 py-3 space-y-3 bg-white">
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>Client</span>
      <span className="font-medium text-slate-900">
        {project.client || "Not specified"}
      </span>
    </div>

    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>Final Bid to Customer</span>
      <span className="font-semibold text-emerald-600">
        $
        {Number(project.finalBidToCustomer || 0).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </span>
    </div>

    {/* Little hint line at bottom of body */}
    <p className="text-[11px] text-slate-400">
      Track budget, schedule, and documents for this job from the project
      dashboard.
    </p>
  </div>

  {/* Footer */}
  <div className="border-t bg-slate-50 px-4 py-3 flex items-center justify-between">
    <p className="text-[11px] text-slate-400 mr-2">
      Last updated just now (local browser data).
    </p>

    <Link href={`/projects/${project.id}`}>
      <Button size="sm" variant="default">
        Open Project
      </Button>
    </Link>
  </div>
</Card>

            );
          })}
        </div>
      )}
    </div>
  </AppShell>
  );
}
