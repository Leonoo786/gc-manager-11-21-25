'use client';

import {
  ArrowUp,
  ClipboardList,
  DollarSign,
  Plus,
  TrendingUp,
  Users,
  BarChart3 as BarChart3Icon,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

import type { ChartConfig } from '@/components/ui/chart';
import * as React from 'react';
import { format, parse, isValid, differenceInDays } from 'date-fns';


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  DonutChart,
  DonutChartLegend,
} from '@/components/ui/recharts/donut-chart';
import { BarChart3 } from '@/components/icons';
import { type Project } from '../projects/projects-data';
import { tasksData } from '../tasks/tasks-data';
import { teamMembers } from '../team/team-data';

// auth helper
import { getCurrentUser, type AuthUser } from '@/lib/auth';

const chartConfig = {
  projects: {
    label: 'Projects',
  },
  Active: {
    label: 'Active',
    color: 'hsl(var(--chart-2))',
  },
  Planning: {
    label: 'Planning',
    color: 'hsl(var(--chart-4))',
  },
  'On Hold': {
    label: 'On Hold',
    color: 'hsl(var(--muted))',
  },
  Completed: {
    label: 'Completed',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

type CategorySummary = {
  category: string;
  totalBudget: number;
  totalSpent: number;
  utilization: number;
};

type ActivityItem = {
  id: string;
  label: string;
  date: Date;
  meta?: string;
};

function parseProjectDate(raw?: string | null): Date | null {
  if (!raw) return null;

  // Try several formats – in order
  const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'MMM d, yyyy'];

  for (const fmt of formats) {
    const d = parse(raw, fmt, new Date());
    if (isValid(d)) return d;
  }

  return null;
}


function formatProjectDate(date: Date | null): string {
  if (!date) return 'No date';
  return format(date, 'MM/dd/yyyy'); // 12/06/2025 style
}

type DashboardTimelineInfo = {
  startLabel: string;
  currentLabel: string;
  endLabel: string;
  totalDaysLabel: string;
  progressPercent: number;
};

function computeDashboardTimeline(project: Project): DashboardTimelineInfo {
  const start = parseProjectDate(project.startDate);
  const end = parseProjectDate(project.endDate);
  const today = new Date();

  // Labels
  const startLabel = start ? formatProjectDate(start) : 'No start date';
  const endLabel = end ? formatProjectDate(end) : 'No end date';

  let totalDaysLabel = 'N/A';
  let currentLabel = 'N/A';
  let progressPercent = 0;

  if (start && end && end > start) {
    const totalDays = Math.max(differenceInDays(end, start), 1);
    const daysSoFar = Math.min(
      Math.max(differenceInDays(today, start), 0),
      totalDays,
    );

    totalDaysLabel = `${totalDays} days`;
    currentLabel = `${format(today, 'MM/dd/yyyy')} • ${daysSoFar} days so far`;
    progressPercent = (daysSoFar / totalDays) * 100;
  }

  return {
    startLabel,
    currentLabel,
    endLabel,
    totalDaysLabel,
    progressPercent,
  };
}


export default function DashboardPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [teamSearch, setTeamSearch] = React.useState('');
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('projects');
      setProjects(savedProjects ? JSON.parse(savedProjects) : []);
    }
    setIsMounted(true);

    const u = getCurrentUser();
    setUser(u);
  }, []);

  // ---------- Normalize projects with computed progress ----------
  const dashboardProjects = React.useMemo(() => {
    return projects.map((project) => {
      const startDate =
        project.startDate &&
        isValid(parse(project.startDate, 'MMM d, yyyy', new Date()))
          ? parse(project.startDate, 'MMM d, yyyy', new Date())
          : null;
      const endDate =
        project.endDate &&
        isValid(parse(project.endDate, 'MMM d, yyyy', new Date()))
          ? parse(project.endDate, 'MMM d, yyyy', new Date())
          : null;

      let progress = 0;
      if (startDate && endDate && startDate < endDate) {
        const totalDays = differenceInDays(endDate, startDate);
        const daysPassed = Math.max(
          0,
          differenceInDays(new Date(), startDate),
        );
        progress =
          totalDays > 0
            ? Math.min(100, (daysPassed / totalDays) * 100)
            : 0;
      } else if (typeof project.progress === 'number') {
        progress = project.progress;
      }

      return {
        ...project,
        progress: Math.round(progress),
      };
    });
  }, [projects]);

  // ---------- High-level metrics ----------
  const {
    activeProjectsCount,
    tasksDueTodayCount,
    tasksDueToday,
    totalBudget,
    totalSpent,
    overallBudgetUtilization,
  } = React.useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === 'Active');

    const tasksDue = tasksData.filter((t) => {
      if (!t.dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      try {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      } catch {
        return false;
      }
    });

    const budget = projects.reduce((acc, p) => {
      const items = (p as any).budgetData ?? [];
      return (
        acc +
        items.reduce(
          (bAcc: number, b: any) =>
            bAcc + (b.originalBudget ?? 0),
          0,
        )
      );
    }, 0);

    const spent = projects.reduce((acc, p) => {
      const items = (p as any).expensesData ?? [];
      return (
        acc +
        items.reduce(
          (eAcc: number, e: any) => eAcc + (e.amount ?? 0),
          0,
        )
      );
    }, 0);

    const utilization = budget > 0 ? (spent / budget) * 100 : 0;

    return {
      activeProjectsCount: activeProjects.length,
      tasksDueTodayCount: tasksDue.length,
      tasksDueToday: tasksDue,
      totalBudget: budget,
      totalSpent: spent,
      overallBudgetUtilization: utilization,
    };
  }, [projects]);

  // ---------- Project status donut data ----------
  const projectStatusData = React.useMemo(() => {
    const statusCounts = projects.reduce(
      (acc, p) => {
        const status = p.status as Project['status'];
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<Project['status'], number>,
    );

    return Object.entries(statusCounts).map(
      ([status, count]) => ({
        name: status,
        value: count,
        fill:
          chartConfig[status as keyof typeof chartConfig]?.color ||
          'hsl(var(--muted))',
      }),
    );
  }, [projects]);

  // ---------- Team filtering ----------
  const filteredTeamMembers = React.useMemo(() => {
    if (!teamSearch) return teamMembers;
    return teamMembers.filter((member) =>
      member.name.toLowerCase().includes(teamSearch.toLowerCase()),
    );
  }, [teamSearch]);

  // ---------- Helpers for progress / colors ----------
  const getProgressColorClass = (progress: number) => {
    if (progress > 100) return '[&>*]:bg-destructive';
    if (progress > 75) return '[&>*]:bg-yellow-500';
    return '[&>*]:bg-green-500';
  };

  const getBudgetUtilizationColor = (progress: number) => {
    if (progress > 100) return '[&>*]:bg-destructive';
    if (progress > 75) return '[&>*]:bg-yellow-500';
    return '[&>*]:bg-blue-500';
  };

  // ---------- Category Budget Tracking ----------
  const categorySummary: CategorySummary[] = React.useMemo(() => {
    const map = new Map<string, { budget: number; spent: number }>();

    projects.forEach((p) => {
      const budgetItems = (p as any).budgetData ?? [];
      budgetItems.forEach((item: any) => {
        const category = (item.category || 'Uncategorized').trim();
        if (!map.has(category)) {
          map.set(category, { budget: 0, spent: 0 });
        }
        const entry = map.get(category)!;
        entry.budget += item.originalBudget ?? 0;
      });

      const expenses = (p as any).expensesData ?? [];
      expenses.forEach((exp: any) => {
        const category = (exp.category || 'Uncategorized').trim();
        if (!map.has(category)) {
          map.set(category, { budget: 0, spent: 0 });
        }
        const entry = map.get(category)!;
        entry.spent += exp.amount ?? 0;
      });
    });

    const arr: CategorySummary[] = Array.from(map.entries()).map(
      ([category, { budget, spent }]) => ({
        category,
        totalBudget: budget,
        totalSpent: spent,
        utilization: budget > 0 ? (spent / budget) * 100 : 0,
      }),
    );

    // sort by spent descending
    arr.sort((a, b) => b.totalSpent - a.totalSpent);

    return arr;
  }, [projects]);

  // ---------- Recent Activity ----------
  const recentActivity: ActivityItem[] = React.useMemo(() => {
    const items: ActivityItem[] = [];

    // Tasks: treat dueDate as activity date
    tasksData.forEach((t) => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (Number.isNaN(d.getTime())) return;
      items.push({
        id: `task-${t.id ?? t.title}`,
        label: `Task: ${t.title}`,
        date: d,
        meta: t.status === 'completed' ? 'Completed' : 'Due',
      });
    });

    // Projects: use startDate if present
    projects.forEach((p) => {
      if (!p.startDate) return;
      const parsed = parse(p.startDate, 'MMM d, yyyy', new Date());
      if (!isValid(parsed)) return;
      items.push({
        id: `proj-${p.id}`,
        label: `Project started: ${p.name}`,
        date: parsed,
        meta: p.status,
      });
    });

    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    return items.slice(0, 5);
  }, [projects]);

  if (!isMounted) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          {user?.name
            ? `Welcome back, ${user.name}. Here is your project overview.`
            : 'Welcome back. Here is your project overview.'}
        </p>
      </div>

      {/* TOP METRIC CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Active Projects with hover list */}
        <Card className="relative group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeProjectsCount}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-500" />
              Up to date
            </p>
          </CardContent>

          {/* Hover overlay listing active projects */}
          {activeProjectsCount > 0 && (
            <div className="pointer-events-none absolute left-2 right-2 top-full z-10 mt-2 hidden rounded-md border bg-popover p-3 text-xs shadow-md group-hover:block">
              <div className="mb-1 font-semibold">
                Active Projects
              </div>
              <ul className="space-y-1">
                {dashboardProjects
                  .filter((p) => p.status === 'Active')
                  .slice(0, 4)
                  .map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-muted-foreground">
                        {p.progress ?? 0}% complete
                      </span>
                    </li>
                  ))}
                {activeProjectsCount > 4 && (
                  <li className="text-muted-foreground">
                    +{activeProjectsCount - 4} more…
                  </li>
                )}
              </ul>
            </div>
          )}
        </Card>

        {/* Tasks Due Today */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Tasks Due Today
            </CardTitle>
            <Link
              href="/tasks"
              className="text-xs font-medium text-primary hover:underline"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">
              {tasksDueTodayCount}
            </div>
            {tasksDueTodayCount > 0 ? (
              <>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-orange-500" />
                  Needs attention today
                </p>
                <div className="mt-1 space-y-2 text-xs max-h-28 overflow-auto">
                  {tasksDueToday.slice(0, 4).map((t) => (
                    <div
                      key={t.id ?? t.title}
                      className="flex items-center justify-between rounded-md border px-2 py-1"
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground">
                        {t.projectName ?? 'General'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                All caught up for today.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Budget Utilization */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallBudgetUtilization.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE SECTION: timeline + project status + budget overview / tasks */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* LEFT: Project Timeline + Status */}
        <div className="lg:col-span-3 space-y-6">
          {/* Project Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Timeline</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    All Projects
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Projects</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">
                      Project
                    </TableHead>
                    <TableHead>Timeline</TableHead>
                  </TableRow>
                </TableHeader>
<TableBody>
  {dashboardProjects.length > 0 ? (
    dashboardProjects.map((project) => {
      const today = new Date();

      // --- parse dates from project (supports multiple formats) ---
      const startParsed = parseProjectDate(project.startDate);
      const endParsed   = parseProjectDate(project.endDate);

      // --- labels ---
      const startLabel =
        startParsed && isValid(startParsed)
          ? format(startParsed, 'MM/dd/yyyy')
          : '—';

      const endLabel =
        endParsed && isValid(endParsed)
          ? format(endParsed, 'MM/dd/yyyy')
          : '—';

      let middleLabel = 'N/A';
      let rightLabel  = 'N/A';

      // --- timeline math (total / elapsed / remaining) ---
      let totalDays: number | null = null;
      let elapsedDays: number | null = null;
      let remainingDays: number | null = null;

      if (startParsed && endParsed && isValid(startParsed) && isValid(endParsed)) {
        totalDays = Math.max(1, differenceInDays(endParsed, startParsed));

        // days from start → today (clamped at 0)
        elapsedDays = Math.max(0, differenceInDays(
          today < startParsed ? startParsed : today,
          startParsed,
        ));

        // days from today → end (negative means overdue)
        remainingDays = differenceInDays(endParsed, today);

        middleLabel = `Today: ${elapsedDays} day${elapsedDays === 1 ? '' : 's'}`;

        if (remainingDays < 0) {
          rightLabel = `Total: ${totalDays} · Overdue: ${Math.abs(
            remainingDays,
          )} day${Math.abs(remainingDays) === 1 ? '' : 's'}`;
        } else {
          rightLabel = `Total: ${totalDays} · Remaining: ${remainingDays} day${
            remainingDays === 1 ? '' : 's'
          }`;
        }
      }

      // --- bar width ---
      let barPercent: number;
      if (totalDays && elapsedDays !== null) {
        const ratio = elapsedDays / totalDays;
        barPercent = Math.max(6, Math.min(100, ratio * 100));
      } else {
        // fallback to progress % if we don’t have dates
        barPercent = Math.max(
          6,
          Math.min(100, project.progress ?? 0),
        );
      }

      // --- color based on status & whether we’re past end date ---
      let statusColor =
        project.status === 'Active'
          ? 'bg-sky-500'
          : project.status === 'Planning'
          ? 'bg-violet-500'
          : project.status === 'On Hold'
          ? 'bg-yellow-500'
          : project.status === 'Completed'
          ? 'bg-emerald-500'
          : 'bg-slate-400';

      if (startParsed && endParsed) {
        if (today < startParsed) {
          // not started yet
          statusColor = 'bg-slate-400';
        } else if (today > endParsed) {
          // past end date → overdue
          statusColor = 'bg-red-500';
        } else {
          // between start & end
          statusColor = 'bg-sky-500';
        }
      }

      return (
        <TableRow key={project.id}>
          {/* LEFT: project name + status dot */}
          <TableCell>
            <div className="font-medium">{project.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{project.status}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
            </div>
          </TableCell>

          {/* RIGHT: timeline labels + bar */}
          <TableCell>
            <div className="space-y-1">
              {/* top labels: start | today & elapsed | total / remaining */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{startLabel}</span>
                <span>{middleLabel}</span>
                <span className="text-right">{rightLabel}</span>
              </div>

              {/* bottom labels: end date on its own row (optional) */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="opacity-0">.</span>
                <span className="text-center">End: {endLabel}</span>
                <span className="opacity-0">.</span>
              </div>

              {/* timeline bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${statusColor}`}
                  style={{ width: `${barPercent}%` }}
                />
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    })
  ) : (
    <TableRow>
      <TableCell
        colSpan={2}
        className="h-24 text-center text-sm text-muted-foreground"
      >
        No projects yet. Create a project to see it on the timeline.
      </TableCell>
    </TableRow>
  )}
</TableBody>

              </Table>
            </CardContent>
          </Card>

          {/* Project Status donut */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
              <CardDescription>All Projects</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">
                  On Schedule
                </p>
                <p className="text-2xl font-bold">
                  {
                    projects.filter(
                      (p) =>
                        p.status === 'Active' ||
                        p.status === 'Planning',
                    ).length
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">
                  Delayed
                </p>
                <p className="text-2xl font-bold">
                  {
                    projects.filter(
                      (p) => p.status === 'On Hold',
                    ).length
                  }
                </p>
              </div>
              {projectStatusData.length > 0 ? (
                <div className="flex items-center justify-center">
                  <DonutChart
                    data={projectStatusData}
                    config={chartConfig}
                    className="h-28 w-28"
                  >
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent hideLabel />
                      }
                    />
                    <DonutChartLegend />
                  </DonutChart>
                </div>
              ) : (
                <div className="h-28 col-span-1 flex items-center justify-center text-muted-foreground">
                  No project data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Tasks, Budget overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks Due Today (secondary card removed; already above) */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>All Projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Budget
                  </p>
                  <p className="text-xl font-bold">
                    $
                    {totalBudget.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Spent to Date
                  </p>
                  <p className="text-xl font-bold">
                    $
                    {totalSpent.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Overall Budget Utilization
                </p>
                <Progress
                  value={overallBudgetUtilization}
                  className={`h-2 mt-1 ${getBudgetUtilizationColor(
                    overallBudgetUtilization,
                  )}`}
                />
              </div>
              {totalBudget === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3Icon className="h-12 w-12 mx-auto" />
                  <p className="mt-2">No budget data found</p>
                  <p className="text-xs">
                    Create projects and budgets to see an
                    overview.
                  </p>
                </div>
              ) : (
                <div className="h-6" />
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" asChild>
                <Link href="/budget">View Full Budget</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  alert('Exporting report (stubbed)…')
                }
              >
                <TrendingUp className="mr-2 h-4 w-4" /> Export
                Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* BOTTOM ROW: Category tracking, Recent activity, Team */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Category Budget Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Category Budget Tracking</CardTitle>
          </CardHeader>
          <CardContent className="h-48 overflow-y-auto">
            {categorySummary.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <DollarSign className="w-10 h-10 mb-2 opacity-60" />
                <p>No category budgets found</p>
                <p className="text-xs">
                  Set up category budgets to track spending.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {categorySummary.slice(0, 6).map((c) => {
                  const pct = Math.min(
                    150,
                    Math.max(
                      0,
                      Number.isFinite(c.utilization)
                        ? c.utilization
                        : 0,
                    ),
                  );
                  return (
                    <div key={c.category} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {c.category}
                        </span>
                        <span className="text-muted-foreground">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            pct > 100
                              ? 'bg-destructive'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(pct, 150)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>
                          Budget $
                          {c.totalBudget.toLocaleString()}
                        </span>
                        <span>
                          Spent $
                          {c.totalSpent.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  alert('Clearing activity is not yet implemented.')
                }
              >
                Clear All
              </Button>
              <Link
                href="#"
                className="text-sm font-medium hover:underline"
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="h-48 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No recent activity.
              </div>
            ) : (
              <ul className="space-y-2 text-xs">
                {recentActivity.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col rounded-md border px-3 py-2"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {a.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {a.date.toLocaleDateString()}
                      </span>
                    </div>
                    {a.meta && (
                      <span className="text-[11px] text-muted-foreground">
                        {a.meta}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Team Members</CardTitle>
            <Link
              href="/team"
              className="text-sm font-medium hover:underline"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                placeholder="Search members..."
                className="pr-10"
                value={teamSearch}
                onChange={(e) =>
                  setTeamSearch(e.target.value)
                }
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1 h-8 w-8"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {filteredTeamMembers.length > 0 ? (
                <div className="w-full space-y-4">
                  {filteredTeamMembers
                    .slice(0, 3)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={member.avatarUrl}
                            data-ai-hint="person face"
                          />
                          <AvatarFallback>
                            {member.fallback}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-8">
                  No team members to display.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
