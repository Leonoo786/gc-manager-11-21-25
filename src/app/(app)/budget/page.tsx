'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Filter,
  PiggyBank,
  Search,
  Wallet,
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
import { Progress } from '@/components/ui/progress';

import { projectsData, type Project } from '../projects/projects-data';

const PROJECTS_STORAGE_KEY = 'projects';

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

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BudgetPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Planning' | 'Completed' | 'On Hold'>('all');

  useEffect(() => {
    const initial = getInitialProjects();
    setProjects(initial);
    setIsMounted(true);
  }, []);

  const {
    totalBudget,
    totalFinalBid,
    totalSpent,
    totalRemaining,
    totalProfitLoss,
    avgUtilization,
  } = useMemo(() => {
    if (!projects.length) {
      return {
        totalBudget: 0,
        totalFinalBid: 0,
        totalSpent: 0,
        totalRemaining: 0,
        totalProfitLoss: 0,
        avgUtilization: 0,
      };
    }

    let budgetSum = 0;
    let finalBidSum = 0;
    let spentSum = 0;

    projects.forEach((p) => {
      const anyP: any = p;
      const budgetItems = anyP.budgetData ?? [];
      const expensesItems = anyP.expensesData ?? [];

      const budgetFromTable = budgetItems.reduce(
        (acc: number, item: any) => acc + (item.originalBudget ?? 0),
        0
      );

      const spentFromTable = expensesItems.reduce(
        (acc: number, item: any) => acc + (item.amount ?? 0),
        0
      );

      const budgetField = (anyP.budget ?? 0) as number;
      const finalBidField = (anyP.finalBid ?? 0) as number;

      const projectBudget = budgetFromTable || budgetField || 0;
      const projectSpent = spentFromTable || (anyP.spent ?? 0) || 0;
      const projectFinalBid = finalBidField || 0;

      budgetSum += projectBudget;
      finalBidSum += projectFinalBid;
      spentSum += projectSpent;
    });

    const remaining = budgetSum - spentSum;
    const profitLoss = finalBidSum - spentSum;
    const utilization = budgetSum > 0 ? (spentSum / budgetSum) * 100 : 0;

    return {
      totalBudget: budgetSum,
      totalFinalBid: finalBidSum,
      totalSpent: spentSum,
      totalRemaining: remaining,
      totalProfitLoss: profitLoss,
      avgUtilization: utilization,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const term = search.toLowerCase();

    return projects.filter((p) => {
      const anyP: any = p;

      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      if (!term) return true;

      const name = (p.name ?? '').toLowerCase();
      const client = (anyP.client ?? '').toLowerCase();
      const city = (anyP.city ?? '').toLowerCase();

      return (
        name.includes(term) ||
        client.includes(term) ||
        city.includes(term)
      );
    });
  }, [projects, search, statusFilter]);

  if (!isMounted) {
    return <div className="p-8">Loading budget overview...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Budget
          </h1>
          <p className="text-muted-foreground">
            High-level view of budgets, costs, and profit across all projects.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-xs uppercase text-muted-foreground tracking-wide">
            Overall Utilization
          </span>
          <span className="text-2xl font-semibold">
            {avgUtilization.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                Total Budget (Cost)
              </CardTitle>
            </div>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatMoney(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Sum of internal contract amounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                Final Bid to Customers
              </CardTitle>
            </div>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatMoney(totalFinalBid)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue side across projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                Spent to Date
              </CardTitle>
            </div>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatMoney(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Sum of coded expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                Profit / Loss
              </CardTitle>
            </div>
            {totalProfitLoss >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={
                'text-2xl font-bold ' +
                (totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-destructive')
              }
            >
              ${formatMoney(Math.abs(totalProfitLoss))}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalProfitLoss >= 0 ? 'Estimated margin so far' : 'Over budget vs final bid'}
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
                Project Budget Overview
              </CardTitle>
              <CardDescription>
                Compare budget, spend, and margin for each project.
              </CardDescription>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              Filters
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and filters row */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative max-w-md w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by project name, client, or city..."
                className="h-9 pl-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[26%]">Project</TableHead>
                  <TableHead className="w-[12%]">Status</TableHead>
                  <TableHead className="w-[14%]">Budget (Cost)</TableHead>
                  <TableHead className="w-[14%]">Final Bid</TableHead>
                  <TableHead className="w-[14%]">Spent</TableHead>
                  <TableHead className="w-[14%]">Remaining</TableHead>
                  <TableHead className="w-[14%]">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-20 text-center text-muted-foreground text-sm"
                    >
                      No projects match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((p, index) => {
                    const anyP: any = p;
                    const budgetItems = anyP.budgetData ?? [];
                    const expensesItems = anyP.expensesData ?? [];

                    const budgetFromTable = budgetItems.reduce(
                      (acc: number, item: any) =>
                        acc + (item.originalBudget ?? 0),
                      0
                    );
                    const spentFromTable = expensesItems.reduce(
                      (acc: number, item: any) => acc + (item.amount ?? 0),
                      0
                    );

                    const budgetField = (anyP.budget ?? 0) as number;
                    const finalBidField = (anyP.finalBid ?? 0) as number;

                    const projectBudget = budgetFromTable || budgetField || 0;
                    const projectSpent =
                      spentFromTable || (anyP.spent ?? 0) || 0;
                    const projectRemaining = projectBudget - projectSpent;
                    const projectUtilization =
                      projectBudget > 0
                        ? (projectSpent / projectBudget) * 100
                        : 0;

                    const projectProfitLoss = finalBidField - projectSpent;

                    const status = p.status ?? 'Active';

                    return (
                      <TableRow key={p.id ?? `project-${index}`}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm">
                              {p.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {anyP.client || 'No client'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          ${formatMoney(projectBudget)}
                        </TableCell>
                        <TableCell className="text-sm">
                          ${formatMoney(finalBidField || 0)}
                        </TableCell>
                        <TableCell className="text-sm">
                          ${formatMoney(projectSpent)}
                        </TableCell>
                        <TableCell
                          className={
                            'text-sm ' +
                            (projectRemaining < 0
                              ? 'text-destructive'
                              : 'text-emerald-700')
                          }
                        >
                          {projectRemaining < 0 ? '-' : ''}
                          ${formatMoney(Math.abs(projectRemaining))}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium">
                              {projectUtilization.toFixed(0)}%
                            </span>
                            <Progress
                              value={projectUtilization}
                              className="h-1.5"
                            />
                            <span
                              className={
                                'text-[11px] ' +
                                (projectProfitLoss >= 0
                                  ? 'text-emerald-600'
                                  : 'text-destructive')
                              }
                            >
                              {projectProfitLoss >= 0 ? 'Profit' : 'Loss'} $
                              {formatMoney(Math.abs(projectProfitLoss))}
                            </span>
                          </div>
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
