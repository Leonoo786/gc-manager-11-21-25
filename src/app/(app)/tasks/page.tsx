'use client';

import * as React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  ListChecks,
  Plus,
  Search,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { tasksData } from './tasks-data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Infer the Task type from tasksData so we stay in sync with your existing data file
type Task = (typeof tasksData)[number];

const TASKS_STORAGE_KEY = 'tasks';

function getInitialTasks(): Task[] {
  if (typeof window === 'undefined') {
    return tasksData;
  }
  try {
    const saved = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!saved) return tasksData;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed as Task[];
    }
    return tasksData;
  } catch {
    return tasksData;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'pending':
      return 'outline';
    case 'in-progress':
      return 'default';
    case 'completed':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3" />;
    case 'in-progress':
      return <ListChecks className="h-3 w-3" />;
    case 'completed':
      return <CheckCircle2 className="h-3 w-3" />;
    default:
      return null;
  }
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Simple form shape for new tasks
type NewTaskFormValues = {
  title: string;
  project: string;
  assignee: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
};

export default function TasksPage() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [showTodayOnly, setShowTodayOnly] = React.useState(false);

  // ✅ Tasks now initialized from localStorage (with fallback to tasksData)
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  const [isNewTaskOpen, setIsNewTaskOpen] = React.useState(false);
  const [newTask, setNewTask] = React.useState<NewTaskFormValues>({
    title: '',
    project: '',
    assignee: '',
    description: '',
    dueDate: '',
    status: 'pending',
  });

  React.useEffect(() => {
    setTasks(getInitialTasks());
    setIsMounted(true);
  }, []);

  // ✅ Persist tasks to localStorage whenever they change
  React.useEffect(() => {
    if (!isMounted) return;
    try {
      window.localStorage.setItem(
        TASKS_STORAGE_KEY,
        JSON.stringify(tasks)
      );
    } catch (err) {
      console.error('Failed to save tasks to localStorage:', err);
    }
  }, [tasks, isMounted]);

  const todayMidnight = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      const t: any = task;
      const title = String(t.title ?? '').toLowerCase();
      const project = String(t.project ?? '').toLowerCase();
      const assignee = String(t.assignee ?? '').toLowerCase();
      const searchTerm = search.toLowerCase();

      if (
        searchTerm &&
        !title.includes(searchTerm) &&
        !project.includes(searchTerm) &&
        !assignee.includes(searchTerm)
      ) {
        return false;
      }

      if (statusFilter !== 'all') {
        if (t.status !== statusFilter) return false;
      }

      if (showTodayOnly) {
        const dueDateStr = t.dueDate as string | undefined;
        if (!dueDateStr) return false;

        const d = new Date(dueDateStr);
        if (Number.isNaN(d.getTime())) return false;

        d.setHours(0, 0, 0, 0);
        if (d.getTime() !== todayMidnight) return false;
      }

      return true;
    });
  }, [tasks, search, statusFilter, showTodayOnly, todayMidnight]);

  const counts = React.useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t: any) => t.status === 'pending').length;
    const inProgress = tasks.filter((t: any) => t.status === 'in-progress').length;
    const completed = tasks.filter((t: any) => t.status === 'completed').length;

    const dueToday = tasks.filter((t: any) => {
      const dueDateStr = t.dueDate as string | undefined;
      if (!dueDateStr) return false;
      const d = new Date(dueDateStr);
      if (Number.isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);
      return d.getTime() === todayMidnight;
    }).length;

    return { total, pending, inProgress, completed, dueToday };
  }, [tasks, todayMidnight]);

  // Handle add task
  const handleNewTaskChange = (field: keyof NewTaskFormValues, value: string) => {
    setNewTask((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = newTask.title.trim();
    if (!trimmedTitle) {
      // simple guard: must at least have title
      return;
    }

    const taskToAdd: any = {
      id: Date.now().toString(),
      title: trimmedTitle,
      project: newTask.project.trim() || 'General',
      assignee: newTask.assignee.trim() || 'Unassigned',
      description: newTask.description.trim(),
      status: newTask.status,
      dueDate: newTask.dueDate.trim() || undefined,
    };

    setTasks((prev) => [...prev, taskToAdd]);

    // reset + close dialog
    setNewTask({
      title: '',
      project: '',
      assignee: '',
      description: '',
      dueDate: '',
      status: 'pending',
    });
    setIsNewTaskOpen(false);
  };

  if (!isMounted) {
    // avoid hydration mismatch while we decide initial tasks
    return <div className="p-8">Loading tasks...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Tasks
          </h1>
          <p className="text-muted-foreground">
            View and track tasks across all your projects.
          </p>
        </div>

        {/* Add Task dialog */}
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a task to track work on a project. Tasks are stored locally in your browser.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Task Title <span className="text-destructive">*</span>
                </label>
                <Input
                  value={newTask.title}
                  onChange={(e) => handleNewTaskChange('title', e.target.value)}
                  placeholder="e.g., Pour concrete for slab"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Input
                    value={newTask.project}
                    onChange={(e) => handleNewTaskChange('project', e.target.value)}
                    placeholder="e.g., Temple 8845"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assignee</label>
                  <Input
                    value={newTask.assignee}
                    onChange={(e) => handleNewTaskChange('assignee', e.target.value)}
                    placeholder="e.g., Site Foreman"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => handleNewTaskChange('description', e.target.value)}
                  placeholder="Optional details for this task..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => handleNewTaskChange('dueDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={newTask.status}
                    onValueChange={(val) =>
                      handleNewTaskChange('status', val as NewTaskFormValues['status'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewTaskOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.pending}</div>
            <p className="text-xs text-muted-foreground">
              Waiting to be started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.dueToday}</div>
            <p className="text-xs text-muted-foreground">
              Tasks with today&apos;s due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4" />
                Task List
              </CardTitle>
              <CardDescription>
                Filter tasks by status, search, or today&apos;s due date.
              </CardDescription>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              Filters
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + controls row */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* Search */}
            <div className="relative max-w-md w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by task, project, or assignee..."
                className="h-9 pl-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Select
                value={statusFilter}
                onValueChange={(val) =>
                  setStatusFilter(val as 'all' | 'pending' | 'in-progress' | 'completed')
                }
              >
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant={showTodayOnly ? 'default' : 'outline'}
                size="sm"
                className="h-9 text-xs flex items-center gap-2"
                onClick={() => setShowTodayOnly((prev) => !prev)}
              >
                <Calendar className="h-3 w-3" />
                Due Today
              </Button>
            </div>
          </div>

          {/* Tasks table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Task</TableHead>
                  <TableHead className="w-[18%]">Project</TableHead>
                  <TableHead className="w-[18%]">Assignee</TableHead>
                  <TableHead className="w-[14%]">Status</TableHead>
                  <TableHead className="w-[14%]">Due Date</TableHead>
                  <TableHead className="w-[8%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-20 text-center text-muted-foreground text-sm"
                    >
                      No tasks match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task, index) => {
                    const t: any = task;
                    const status = String(t.status ?? 'pending');
                    const title = String(t.title ?? 'Untitled Task');
                    const project = String(t.project ?? '—');
                    const assignee = String(t.assignee ?? 'Unassigned');
                    const dueDate = t.dueDate as string | undefined;

                    return (
                      <TableRow key={t.id ?? `task-${index}`}>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm">
                              {title}
                            </span>
                            {t.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {t.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm">
                          {project}
                        </TableCell>
                        <TableCell className="align-top text-sm">
                          {assignee}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant={getStatusBadgeVariant(status) as any}
                            className={cn(
                              'gap-1 px-2 py-0.5 text-[11px]',
                              status === 'completed' &&
                                'bg-emerald-50 text-emerald-700 border-emerald-100',
                              status === 'pending' &&
                                'bg-amber-50 text-amber-700 border-amber-100',
                              status === 'in-progress' &&
                                'bg-blue-50 text-blue-700 border-blue-100'
                            )}
                          >
                            {getStatusIcon(status)}
                            {getStatusLabel(status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top text-sm">
                          {formatDate(dueDate)}
                        </TableCell>
                        <TableCell className="align-top text-right">
                          {status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Open
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
