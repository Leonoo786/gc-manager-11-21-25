'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  Filter,
  FlagTriangleRight,
  Search,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  User,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import { projectsData, type Project } from '../projects/projects-data';

const PROJECTS_STORAGE_KEY = 'projects';

type NormalizedScheduleItem = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description?: string;
  date?: string; // ISO string or raw
  status?: string;
  assignedTo?: string;
};

function getInitialProjects(): Project[] {
  if (typeof window === 'undefined') {
    return projectsData;
  }
  try {
    const saved = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!saved) return projectsData;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed as Project[];
    }
    return projectsData;
  } catch {
    return projectsData;
  }
}

function safeParseDate(raw?: string) {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function formatDate(raw?: string) {
  const d = safeParseDate(raw);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadge(status?: string) {
  const value = (status ?? '').toLowerCase();

  if (value.includes('complete') || value === 'done') {
    return { label: status ?? 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  }
  if (value.includes('progress') || value === 'active') {
    return { label: status ?? 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-100' };
  }
  if (value.includes('block')) {
    return { label: status ?? 'Blocked', className: 'bg-rose-50 text-rose-700 border-rose-100' };
  }
  if (value.includes('hold')) {
    return { label: status ?? 'On Hold', className: 'bg-amber-50 text-amber-700 border-amber-100' };
  }

  return { label: status ?? 'Not Started', className: 'bg-slate-50 text-slate-700 border-slate-200' };
}

export default function SchedulePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'not-started' | 'in-progress' | 'completed' | 'blocked'>('all');

  useEffect(() => {
    const initial = getInitialProjects();
    setProjects(initial);
    setIsMounted(true);
  }, []);

  // Flatten all projects' scheduleData into one list
  const scheduleItems: NormalizedScheduleItem[] = useMemo(() => {
    const items: NormalizedScheduleItem[] = [];

    projects.forEach((project) => {
      const anyP: any = project;
      const rawSchedule: any[] = anyP.scheduleData ?? [];

      if (!Array.isArray(rawSchedule)) return;

      rawSchedule.forEach((item, index) => {
        const id = item.id?.toString() ?? `${project.id}-sched-${index}`;

        const title =
          item.title ??
          item.name ??
          item.task ??
          `Schedule item #${index + 1}`;

        const description =
          item.description ??
          item.notes ??
          item.detail ??
          undefined;

        const date =
          item.date ??
          item.dueDate ??
          item.startDate ??
          item.endDate ??
          undefined;

        const status =
          item.status ??
          item.state ??
          item.phase ??
          undefined;

        const assignedTo =
          item.assignedTo ??
          item.owner ??
          item.assignee ??
          undefined;

        items.push({
          id,
          projectId: project.id,
          projectName: project.name,
          title,
          description,
          date,
          status,
          assignedTo,
        });
      });
    });

    // Sort by date (earliest first), items without date go to bottom
    return items.sort((a, b) => {
      const da = safeParseDate(a.date);
      const db = safeParseDate(b.date);

      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });
  }, [projects]);

  // Summary metrics
  const { upcomingCount, thisWeekCount, overdueCount } = useMemo(() => {
    if (!scheduleItems.length) {
      return { upcomingCount: 0, thisWeekCount: 0, overdueCount: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    let upcoming = 0;
    let thisWeek = 0;
    let overdue = 0;

    scheduleItems.forEach((item) => {
      const d = safeParseDate(item.date);
      if (!d) return;

      d.setHours(0, 0, 0, 0);

      if (d.getTime() > today.getTime()) {
        upcoming++;
      }
      if (d.getTime() >= today.getTime() && d.getTime() <= endOfWeek.getTime()) {
        thisWeek++;
      }
      if (d.getTime() < today.getTime()) {
        const statusLower = (item.status ?? '').toLowerCase();
        if (!statusLower.includes('complete')) {
          overdue++;
        }
      }
    });

    return { upcomingCount: upcoming, thisWeekCount: thisWeek, overdueCount: overdue };
  }, [scheduleItems]);

  // Filter + search
  const filteredSchedule = useMemo(() => {
    const term = search.toLowerCase();

    return scheduleItems.filter((item) => {
      // project filter
      if (projectFilter !== 'all' && item.projectId !== projectFilter) {
        return false;
      }

      // status filter
      const statusLower = (item.status ?? '').toLowerCase();
      if (statusFilter === 'not-started') {
        if (
          statusLower.includes('progress') ||
          statusLower.includes('complete') ||
          statusLower.includes('block') ||
          statusLower.includes('hold')
        ) {
          return false;
        }
      } else if (statusFilter === 'in-progress') {
        if (!statusLower.includes('progress') && statusLower !== 'active') {
          return false;
        }
      } else if (statusFilter === 'completed') {
        if (!statusLower.includes('complete') && statusLower !== 'done') {
          return false;
        }
      } else if (statusFilter === 'blocked') {
        if (!statusLower.includes('block')) {
          return false;
        }
      }

      if (!term) return true;

      const title = item.title.toLowerCase();
      const projectName = item.projectName.toLowerCase();
      const description = (item.description ?? '').toLowerCase();
      const assignedTo = (item.assignedTo ?? '').toLowerCase();
      const status = (item.status ?? '').toLowerCase();

      return (
        title.includes(term) ||
        projectName.includes(term) ||
        description.includes(term) ||
        assignedTo.includes(term) ||
        status.includes(term)
      );
    });
  }, [scheduleItems, search, projectFilter, statusFilter]);

  if (!isMounted) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading schedule…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Schedule
          </h1>
          <p className="text-muted-foreground">
            See upcoming milestones and tasks across all projects.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                Upcoming Items
              </CardTitle>
              <CardDescription className="text-xs">
                Any item scheduled after today
              </CardDescription>
            </div>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                This Week
              </CardTitle>
              <CardDescription className="text-xs">
                Items scheduled in the next 7 days
              </CardDescription>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                Overdue
              </CardTitle>
              <CardDescription className="text-xs">
                Past due and not completed
              </CardDescription>
            </div>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {overdueCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                Global Schedule
              </CardTitle>
              <CardDescription>
                Filter by project or status to focus on what matters today.
              </CardDescription>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              Filters
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & filters row */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative max-w-md w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by task, project, status, or assignee..."
                className="h-9 pl-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <Select
                value={projectFilter}
                onValueChange={(val) => setProjectFilter(val as typeof projectFilter)}
              >
                <SelectTrigger className="h-9 w-[200px] text-xs">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(val) =>
                  setStatusFilter(val as typeof statusFilter)
                }
              >
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[26%]">Task / Milestone</TableHead>
                  <TableHead className="w-[20%]">Project</TableHead>
                  <TableHead className="w-[14%]">Date</TableHead>
                  <TableHead className="w-[14%]">Status</TableHead>
                  <TableHead className="w-[16%]">Assigned To</TableHead>
                  <TableHead className="w-[10%]">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedule.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-20 text-center text-muted-foreground text-sm"
                    >
                      No schedule items match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedule.map((item, index) => {
                    const parsedDate = safeParseDate(item.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let dateColor = 'text-muted-foreground';
                    let icon: React.ReactNode = <ListChecks className="h-3 w-3" />;

                    if (parsedDate) {
                      const time = parsedDate.getTime();
                      if (time < today.getTime()) {
                        const statusLower = (item.status ?? '').toLowerCase();
                        if (!statusLower.includes('complete')) {
                          dateColor = 'text-destructive';
                          icon = <AlertTriangle className="h-3 w-3 text-destructive" />;
                        }
                      } else if (time === today.getTime()) {
                        dateColor = 'text-amber-600';
                        icon = <FlagTriangleRight className="h-3 w-3 text-amber-600" />;
                      } else {
                        dateColor = 'text-emerald-600';
                        icon = <CheckCircle2 className="h-3 w-3 text-emerald-600" />;
                      }
                    }

                    const statusBadge = getStatusBadge(item.status);

                    return (
                      <TableRow key={item.id ?? `schedule-${index}`}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm">
                              {item.title}
                            </span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.projectName}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className={`inline-flex items-center gap-1 text-xs ${dateColor}`}>
                            {icon}
                            {formatDate(item.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[11px] px-2 py-0.5 ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.assignedTo ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {item.assignedTo}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {/* Very light "type" guess just for visual variety */}
                          {item.title.toLowerCase().includes('pour')
                            ? 'Concrete'
                            : item.title.toLowerCase().includes('inspection')
                            ? 'Inspection'
                            : item.title.toLowerCase().includes('submittal')
                            ? 'Submittal'
                            : 'General'}
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
