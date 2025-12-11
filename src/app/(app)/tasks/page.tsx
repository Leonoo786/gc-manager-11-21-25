'use client';

import * as React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// NEW – dialog + form controls (same as Schedule page)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---- types -----------------------------------------------------------------

type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
type TaskType = 'Task' | 'Milestone' | 'Meeting';

type TaskItem = {
  id: string;
  title: string;
  projectName: string;
  dueDate: string; // yyyy-mm-dd
  status: TaskStatus;
  assignedTo: string;
  type: TaskType;
};

type SimpleProject = {
  id: string;
  name: string;
};

type SimpleVendor = {
  id: string;
  name: string;
};

// ---- helpers: load from localStorage --------------------------------------

const TASKS_STORAGE_KEY = 'global_tasks';

function loadInitialTasks(): TaskItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function persistTasks(tasks: TaskItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify(tasks),
    );
  } catch {
    // ignore
  }
}

function loadProjects(): SimpleProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('projects');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p, idx) => ({
      id: String(p.id ?? idx),
      name: String(p.name ?? 'Untitled Project'),
    }));
  } catch {
    return [];
  }
}

function loadVendors(): SimpleVendor[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('vendors');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v, idx) => ({
      id: String(v.id ?? idx),
      name: String(v.name ?? v.vendorName ?? 'Unnamed Vendor'),
    }));
  } catch {
    return [];
  }
}

// ---- component ------------------------------------------------------------

export default function TasksPage() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [search, setSearch] = React.useState('');

  const [projects, setProjects] = React.useState<SimpleProject[]>([]);
  const [vendors, setVendors] = React.useState<SimpleVendor[]>([]);

  // dialog + form state (ADD ONLY for now)
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [formTitle, setFormTitle] = React.useState('');
  const [formProjectId, setFormProjectId] = React.useState('');
  const [formDueDate, setFormDueDate] = React.useState('');
  const [formStatus, setFormStatus] =
    React.useState<TaskStatus>('Not Started');
  const [formVendorId, setFormVendorId] = React.useState('');
  const [formType, setFormType] = React.useState<TaskType>('Task');

  // mount + load data
  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const initial = loadInitialTasks();
      setTasks(initial);
      setProjects(loadProjects());
      setVendors(loadVendors());
    }
  }, []);

  // persist on change
  React.useEffect(() => {
    if (!isMounted) return;
    persistTasks(tasks);
  }, [tasks, isMounted]);

  if (!isMounted) {
    return <div className="p-6">Loading tasks…</div>;
  }

  // ---- derived views ------------------------------------------------------

  const todayIso = new Date().toISOString().slice(0, 10);

  const tasksDueToday = tasks.filter(
    (t) => t.dueDate === todayIso && t.status !== 'Completed',
  );

  const overdueTasks = tasks.filter(
    (t) => t.dueDate < todayIso && t.status !== 'Completed',
  );

  const filteredTasks = tasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.projectName.toLowerCase().includes(q) ||
      t.assignedTo.toLowerCase().includes(q)
    );
  });

  // ---- handlers -----------------------------------------------------------

  const handleDeleteTask = (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveNewTask = () => {
    if (!formTitle.trim()) {
      window.alert('Please enter a task / milestone name.');
      return;
    }

    const project =
      projects.find((p) => p.id === formProjectId) ?? null;
    const vendor =
      vendors.find((v) => v.id === formVendorId) ?? null;

    const fallbackDate = new Date()
      .toISOString()
      .slice(0, 10);

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: formTitle.trim(),
      projectName: project?.name ?? 'Unassigned',
      dueDate: (formDueDate || fallbackDate).trim(),
      status: formStatus,
      assignedTo: vendor?.name ?? 'Unassigned',
      type: formType,
    };

    setTasks((prev) => [...prev, newTask]);

    // reset + close
    setFormTitle('');
    setFormProjectId('');
    setFormDueDate('');
    setFormStatus('Not Started');
    setFormVendorId('');
    setFormType('Task');
    setIsAddOpen(false);
  };

  const statusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'Blocked':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Not Started':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // ---- render -------------------------------------------------------------

  return (
    <div className="space-y-6 p-6">
      {/* header + summary cards */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage tasks and milestones across all projects.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          + Add Task
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tasks Due Today</CardTitle>
            <CardDescription>Due {todayIso}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {tasksDueToday.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tasks with today&apos;s due date and not yet completed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
            <CardDescription>
              Past-due tasks still open
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {overdueTasks.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tasks past their due date that are not completed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Tasks</CardTitle>
            <CardDescription>All projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{tasks.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Includes active and completed tasks.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* main table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-sm">Global Tasks</CardTitle>
            <CardDescription>
              Filter by project, status, or assignee to focus on what
              matters today.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search by task, project, or assignee…"
              className="h-8 w-60 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">Task / Milestone</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No tasks found. Try a different search or add a new
                    task.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      {task.title}
                    </TableCell>
                    <TableCell>{task.projectName}</TableCell>
                    <TableCell>{task.dueDate || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColor(task.status)}
                      >
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.assignedTo}</TableCell>
                    <TableCell>{task.type}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-xs"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ADD TASK dialog – same fields as Add Schedule Item */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Task / Milestone */}
            <div className="space-y-1">
              <Label htmlFor="task-title">Task / Milestone</Label>
              <Input
                id="task-title"
                placeholder="e.g., Pour foundation"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            {/* Project */}
            <div className="space-y-1">
              <Label>Project</Label>
              <Select
                value={formProjectId}
                onValueChange={setFormProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="__none">
                      No projects found
                    </SelectItem>
                  ) : (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <Label htmlFor="task-date">Date</Label>
              <Input
                id="task-date"
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={formStatus}
                onValueChange={(v) =>
                  setFormStatus(v as TaskStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">
                    Not Started
                  </SelectItem>
                  <SelectItem value="In Progress">
                    In Progress
                  </SelectItem>
                  <SelectItem value="Completed">
                    Completed
                  </SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To – vendors */}
            <div className="space-y-1">
              <Label>Assigned To (Vendor)</Label>
              <Select
                value={formVendorId}
                onValueChange={setFormVendorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length === 0 ? (
                    <SelectItem value="__none">
                      No vendors found
                    </SelectItem>
                  ) : (
                    vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={formType}
                onValueChange={(v) =>
                  setFormType(v as TaskType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Milestone">Milestone</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNewTask}>Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
