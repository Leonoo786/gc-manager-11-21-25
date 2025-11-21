"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { projectsData, type Project } from "../projects/projects-data";
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

type ProfitRow = {
  id: string;
  name: string;
  client: string;
  status: Project["status"];
  revenue: number; // final bid
  cost: number;    // expenses or budget fallback
  profit: number;
  marginPct: number;
};

const currencySymbolMap: Record<string, string> = {
  USD: "$",
  CAD: "CA$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
};

function getSymbol(currency?: string) {
  if (!currency) return "$";
  return currencySymbolMap[currency] ?? "$";
}

export default function ProfitLossPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});
  const [isMounted, setIsMounted] = useState(false);

  // Load projects from localStorage (or seed)
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

  // Load basic app settings (currency + showBudgetInK)
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

  const currencySymbol = getSymbol(settings.currency);

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

  // Build profit rows
  const rows: ProfitRow[] = useMemo(() => {
    return projects.map((project) => {
      const anyP = project as any;

      const budgetItems = anyP.budgetData ?? [];
      const expenseItems = anyP.expensesData ?? [];

      const expensesTotal = Array.isArray(expenseItems)
        ? expenseItems.reduce(
            (acc: number, item: any) => acc + (item.amount ?? 0),
            0
          )
        : 0;

      const budgetCost = Array.isArray(budgetItems)
        ? budgetItems.reduce(
            (acc: number, item: any) => acc + (item.originalBudget ?? 0),
            0
          )
        : 0;

      // If there are expenses, treat that as "actual cost".
      // Otherwise, fall back to total budget cost.
      const cost = expensesTotal > 0 ? expensesTotal : budgetCost;

      const revenue = Number(anyP.finalBid ?? project.finalBid ?? 0);
      const profit = revenue - cost;
      const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        id: project.id,
        name: project.name ?? "Untitled Project",
        client: anyP.client ?? "Unknown client",
        status: anyP.status ?? "Active",
        revenue,
        cost,
        profit,
        marginPct,
      };
    });
  }, [projects]);

  const totals = useMemo(() => {
    if (rows.length === 0) {
      return {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        avgMargin: 0,
      };
    }

    const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);
    const totalCost = rows.reduce((acc, r) => acc + r.cost, 0);
    const totalProfit = rows.reduce((acc, r) => acc + r.profit, 0);
    const avgMargin =
      rows.reduce((acc, r) => acc + r.marginPct, 0) / rows.length;

    return { totalRevenue, totalCost, totalProfit, avgMargin };
  }, [rows]);

  const chartData = useMemo(() => {
    // Take top 5 projects by revenue for chart
    return [...rows]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        profit: r.profit,
      }));
  }, [rows]);

  if (!isMounted) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading profit &amp; loss…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Profit &amp; Loss
          </h1>
          <p className="text-muted-foreground">
            High-level financial overview across all active and past projects.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">
                {formatMoney(totals.totalRevenue)}
              </span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">
                {formatMoney(totals.totalCost)}
              </span>
              <Wallet className="h-4 w-4 text-sky-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Total Profit / Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span
                className={`text-xl font-semibold ${
                  totals.totalProfit < 0
                    ? "text-destructive"
                    : "text-emerald-600"
                }`}
              >
                {formatMoney(totals.totalProfit)}
              </span>
              {totals.totalProfit < 0 ? (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Avg. Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">
                {totals.avgMargin.toFixed(1)}%
              </span>
              <Percent className="h-4 w-4 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + table */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr,2fr]">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <LineChart className="h-4 w-4 text-blue-500" />
              Profit by Project
            </CardTitle>
            <CardDescription>
              Top projects by revenue and their profit (or loss).
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No financial data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
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
                    tickFormatter={(value) => `${value >= 0 ? "" : "-"}${currencySymbol}${Math.abs(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0].payload as { name: string; profit: number };
                        return (
                          <div className="bg-background border rounded-md p-2 shadow-md text-xs">
                            <div className="font-medium">{p.name}</div>
                            <div>
                              Profit:{" "}
                              <span
                                className={
                                  p.profit < 0 ? "text-destructive" : "text-emerald-600"
                                }
                              >
                                {formatMoney(p.profit)}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]} barSize={28}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.profit < 0 ? "#f97373" : "#22c55e"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Detailed table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Project Profit &amp; Loss</CardTitle>
            <CardDescription>
              Final bid, actual cost, and margin for each project.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit / Loss</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-16 text-center text-xs text-muted-foreground"
                      >
                        No project financial data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-sm font-medium">
                          {row.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.client}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatMoney(row.revenue)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatMoney(row.cost)}
                        </TableCell>
                        <TableCell
                          className={`text-right text-xs ${
                            row.profit < 0 ? "text-destructive" : "text-emerald-600"
                          }`}
                        >
                          {formatMoney(row.profit)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {row.marginPct.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
