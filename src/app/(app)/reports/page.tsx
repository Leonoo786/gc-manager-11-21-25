"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  CalendarClock,
  Construction,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { projectsData, type Project } from "../projects/projects-data";
import { tasksData } from "../tasks/tasks-data";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const PROJECTS_STORAGE_KEY = "projects";
const SETTINGS_STORAGE_KEY = "app-settings";

type AppSettings = {
  currency?: "USD" | "CAD" | "EUR" | "GBP" | "AUD";
  showBudgetInK?: boolean;
};

const currencySymbolMap: Record<string, string> = {
  USD: "$",
  CAD: "CA$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
};

function getCurrencySymbol(code?: string) {
  if (!code) return "$";
  return currencySymbolMap[code] ?? "$";
}

type StatusSummary = {
  status: Project["status"];
  count: number;
};

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});
  const [isMounted, setIsMounted] = useState(false);

  // Load projects from localStorage (or fallback seed)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed as Project[]);
        } else {
          setProjects(projectsData);
        }
      } else {
        setProjects(projectsData);
      }
    } catch {
      setProjects(projectsData);
    }
  }, []);

  // Load settings for currency + formatting
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({
          currency: parsed.currency ?? "USD",
          showBudgetInK: parsed.showBudgetInK ?? false,
        });
      } else {
        setSettings({ currency: "USD", showBudgetInK: false });
      }
    } catch {
      setSettings({ currency: "USD", showBudgetInK: false });
    }

    setIsMounted(true);
  }, []);

  const currencySymbol = getCurrencySymbol(settings.currency);

  const formatMoney = (amount: number) => {
    const safe = Number.isFinite(amount) ? amount : 0;

    if (settings.showBudgetInK && Math.abs(safe) >= 1000) {
      const inK = safe / 1000;
      return `${currencySymbol}${inK.toFixed(1)}k`;
    }

    return `${currencySymbol}${safe.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // PROJECT METRICS
  const {
    totalProjects,
    activeProjects,
    planningProjects,
    completedProjects,
    onHoldProjects,
    totalFinalBid,
    totalBudgetCost,
  } = useMemo(() => {
    if (projects.length === 0) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        planningProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalFinalBid: 0,
        totalBudgetCost: 0,
      };
    }

    let active = 0;
    let planning = 0;
    let completed = 0;
    let onHold = 0;

    let revenue = 0;
    let budgetCost = 0;

    for (const p of projects) {
      const anyP = p as any;
      const status = anyP.status ?? p.status ?? "Active";

      if (status === "Active") active += 1;
      if (status === "Planning") planning += 1;
      if (status === "Completed") completed += 1;
      if (status === "On Hold") onHold += 1;

      const finalBid = Number(anyP.finalBid ?? p.finalBid ?? 0);
      revenue += finalBid;

      const budgetItems = anyP.budgetData ?? [];
      if (Array.isArray(budgetItems) && budgetItems.length > 0) {
        const cost = budgetItems.reduce(
          (acc: number, item: any) => acc + (item.originalBudget ?? 0),
          0
        );
        budgetCost += cost;
      } else {
        // fallback to project.budget if no detailed budget
        budgetCost += Number(anyP.budget ?? p.budget ?? 0);
      }
    }

    return {
      totalProjects: projects.length,
      activeProjects: active,
      planningProjects: planning,
      completedProjects: completed,
      onHoldProjects: onHold,
      totalFinalBid: revenue,
      totalBudgetCost: budgetCost,
    };
  }, [projects]);

  // TASK METRICS
  const {
    totalTasks,
    tasksDueToday,
    overdueTasks,
    completedTasks,
  } = useMemo(() => {
    if (!Array.isArray(tasksData) || tasksData.length === 0) {
      return {
        totalTasks: 0,
        tasksDueToday: 0,
        overdueTasks: 0,
        completedTasks: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueToday = 0;
    let overdue = 0;
    let completed = 0;

    for (const t of tasksData as any[]) {
      const status = (t.status ?? "").toString().toLowerCase();
      const dueDateRaw = t.dueDate;

      if (status === "completed" || status === "done") {
        completed += 1;
      }

      if (!dueDateRaw) continue;

      try {
        const d = new Date(dueDateRaw);
        d.setHours(0, 0, 0, 0);

        if (d.getTime() === today.getTime()) {
          dueToday += 1;
        } else if (d.getTime() < today.getTime() && status !== "completed") {
          overdue += 1;
        }
      } catch {
        // ignore parse errors
      }
    }

    return {
      totalTasks: tasksData.length,
      tasksDueToday: dueToday,
      overdueTasks: overdue,
      completedTasks: completed,
    };
  }, []);

  // STATUS SUMMARY FOR TABLE
  const statusSummary: StatusSummary[] = useMemo(() => {
    const map: Record<Project["status"], number> = {
      Active: 0,
      Planning: 0,
      Completed: 0,
      "On Hold": 0,
    };

    for (const p of projects) {
      const anyP = p as any;
      const status = (anyP.status ?? p.status ?? "Active") as Project["status"];
      if (map[status] === undefined) {
        map[status] = 0;
      }
      map[status] += 1;
    }

    return (Object.keys(map) as Project["status"][]).map((status) => ({
      status,
      count: map[status],
    }));
  }, [projects]);

  // CHART: revenue vs budget
  const chartData = useMemo(() => {
    if (projects.length === 0) return [];

    return projects.slice(0, 6).map((p) => {
      const anyP = p as any;
      const budgetItems = anyP.budgetData ?? [];

      const totalBudget = Array.isArray(budgetItems)
        ? budgetItems.reduce(
            (acc: number, item: any) => acc + (item.originalBudget ?? 0),
            0
          )
        : Number(anyP.budget ?? p.budget ?? 0);

      const finalBid = Number(anyP.finalBid ?? p.finalBid ?? 0);

      return {
        name: p.name ?? "Project",
        revenue: finalBid,
        budget: totalBudget,
      };
    });
  }, [projects]);

  if (!isMounted) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading reports…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Reports
          </h1>
          <p className="text-muted-foreground">
            Operational snapshot across all projects and tasks.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Projects Overview
            </CardTitle>
            <CardDescription className="text-[11px]">
              Active load vs total portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">
                {activeProjects} / {totalProjects}
              </div>
              <div className="text-xs text-muted-foreground">
                Active / Total Projects
              </div>
            </div>
            <Construction className="h-5 w-5 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Tasks Snapshot
            </CardTitle>
            <CardDescription className="text-[11px]">
              Due today and overdue vs all tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">
                {tasksDueToday} / {totalTasks}
              </div>
              <div className="text-xs text-muted-foreground">
                Due today / Total tasks
              </div>
              {overdueTasks > 0 && (
                <div className="text-[11px] text-destructive mt-1">
                  {overdueTasks} overdue
                </div>
              )}
            </div>
            <ClipboardList className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Pipeline Revenue
            </CardTitle>
            <CardDescription className="text-[11px]">
              Sum of final bids across all projects
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">
                {formatMoney(totalFinalBid)}
              </div>
              <div className="text-xs text-muted-foreground">
                All project revenue
              </div>
            </div>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Cost vs Revenue
            </CardTitle>
            <CardDescription className="text-[11px]">
              Budgeted cost relative to revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">
                {totalFinalBid === 0
                  ? "0.0%"
                  : `${((totalBudgetCost / totalFinalBid) * 100).toFixed(
                      1
                    )}%`}
              </div>
              <div className="text-xs text-muted-foreground">
                Cost / Revenue ratio
              </div>
            </div>
            {totalBudgetCost > totalFinalBid ? (
              <ArrowDownRight className="h-5 w-5 text-destructive" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts + tables */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        {/* Revenue vs budget chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-sky-500" />
              Revenue vs Budget by Project
            </CardTitle>
            <CardDescription>
              Comparing final bid vs internal cost for key projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No project financial data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `${currencySymbol}${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0].payload as {
                          name: string;
                          revenue: number;
                          budget: number;
                        };
                        return (
                          <div className="bg-background border rounded-md p-2 shadow-md text-xs">
                            <div className="font-medium mb-1">{p.name}</div>
                            <div>Revenue: {formatMoney(p.revenue)}</div>
                            <div>Budget: {formatMoney(p.budget)}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" name="Revenue" barSize={18} radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`rev-${index}`} fill="#22c55e" />
                    ))}
                  </Bar>
                  <Bar dataKey="budget" name="Budget" barSize={18} radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`bud-${index}`} fill="#3b82f6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status + tasks table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-violet-500" />
              Status & Workload Snapshot
            </CardTitle>
            <CardDescription>
              Project states and upcoming workload at a glance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project status summary */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusSummary.map((row) => (
                    <TableRow key={row.status}>
                      <TableCell className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[11px]">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {row.count}
                      </TableCell>
                    </TableRow>
                  ))}
                  {statusSummary.every((s) => s.count === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="h-10 text-center text-xs text-muted-foreground"
                      >
                        No projects to summarize yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Task mini-summary */}
            <div className="rounded-md border px-3 py-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tasks overview</span>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span>{completedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due today</span>
                <span>{tasksDueToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overdue</span>
                <span className={overdueTasks > 0 ? "text-destructive" : ""}>
                  {overdueTasks}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
