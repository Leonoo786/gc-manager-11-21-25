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
import { differenceInDays, parse, isValid } from 'date-fns';

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

// 🔐 NEW: get auth user so we can show their name
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

export default function DashboardPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [teamSearch, setTeamSearch] = React.useState('');
  const [user, setUser] = React.useState<AuthUser | null>(null); // NEW

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('projects');
      setProjects(savedProjects ? JSON.parse(savedProjects) : []);
    }
    setIsMounted(true);

    // read current user from localStorage
    const u = getCurrentUser();
    setUser(u);
  }, []);

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
          differenceInDays(new Date(), startDate)
        );
        progress =
          totalDays > 0
            ? Math.min(100, (daysPassed / totalDays) * 100)
            : 0;
      } else if (project.progress) {
        progress = project.progress;
      }

      return {
        ...project,
        progress: Math.round(progress),
      };
    });
  }, [projects]);

  const {
    activeProjectsCount,
    tasksDueTodayCount,
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
        return (
          dueDate.getTime() === today.getTime() &&
          t.status === 'pending'
        );
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
          0
        )
      );
    }, 0);

    const spent = projects.reduce((acc, p) => {
      const items = (p as any).expensesData ?? [];
      return (
        acc +
        items.reduce(
          (eAcc: number, e: any) => eAcc + (e.amount ?? 0),
          0
        )
      );
    }, 0);

    const utilization = budget > 0 ? (spent / budget) * 100 : 0;

    return {
      activeProjectsCount: activeProjects.length,
      tasksDueTodayCount: tasksDue.length,
      totalBudget: budget,
      totalSpent: spent,
      overallBudgetUtilization: utilization,
    };
  }, [projects]);

  const projectStatusData = React.useMemo(() => {
    const statusCounts = projects.reduce(
      (acc, p) => {
        const status = p.status as Project['status'];
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<Project['status'], number>
    );

    return Object.entries(statusCounts).map(
      ([status, count]) => ({
        name: status,
        value: count,
        fill:
          chartConfig[status as keyof typeof chartConfig]?.color ||
          'hsl(var(--muted))',
      })
    );
  }, [projects]);

  const filteredTeamMembers = React.useMemo(() => {
    if (!teamSearch) return teamMembers;
    return teamMembers.filter((member) =>
      member.name.toLowerCase().includes(teamSearch.toLowerCase())
    );
  }, [teamSearch]);

  const getProgressColorClass = (progress: number) => {
    if (progress > 100) return '[&>*]:bg-destructive';
    if (progress > 75) return '[&>*]:bg-yellow-500';
    return '[&>*]:bg-green-500';
  };

  const getProgressColor = (progress: number) => {
    if (progress > 100) return '[&>*]:bg-destructive';
    if (progress > 75) return '[&>*]:bg-yellow-500';
    return '[&>*]:bg-blue-500';
  };

  if (!isMounted) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          {user?.name
            ? `Welcome back, ${user.name}. Here is your project overview.`
            : 'Welcome Back, Guest. Here is your project overview.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
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
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tasks Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasksDueTodayCount}
            </div>
            {tasksDueTodayCount > 0 ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUp className="h-3 w-3 text-orange-500" />
                Needs attention
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                All caught up
              </p>
            )}
          </CardContent>
        </Card>
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

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
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
                    <TableHead className="w-[250px]">
                      Project
                    </TableHead>
                    <TableHead>Timeline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardProjects.length > 0 ? (
                    dashboardProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="font-medium">
                            {project.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {project.status}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={project.progress}
                              className={`h-2 ${getProgressColorClass(
                                project.progress
                              )}`}
                            />
                            <span className="text-sm font-medium">
                              {project.progress}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="h-24 text-center"
                      >
                        No projects yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
              <CardDescription>All Projects</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground">On Schedule</p>
                <p className="text-2xl font-bold">
                  {
                    projects.filter(
                      (p) =>
                        p.status === 'Active' ||
                        p.status === 'Planning'
                    ).length
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Delayed</p>
                <p className="text-2xl font-bold">
                  {
                    projects.filter(
                      (p) => p.status === 'On Hold'
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

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks Due Today</CardTitle>
              <Link
                href="/tasks"
                className="text-sm font-medium hover:underline"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center h-full gap-4 py-12">
              <ClipboardList className="w-16 h-16 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No tasks due today
              </p>
              <Button asChild>
                <Link href="/tasks">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Task
                </Link>
              </Button>
            </CardContent>
          </Card>

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
                  className={`h-2 mt-1 ${getProgressColor(
                    overallBudgetUtilization
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
                <div className="h-24" />
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" asChild>
                <Link href="/budget">View Full Budget</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  alert('Exporting report...')
                }
              >
                <TrendingUp className="mr-2 h-4 w-4" /> Export
                Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Category Budget Tracking</CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex flex-col items-center justify-center text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground/50" />
            <p className="text-muted-foreground mt-2">
              No category budgets found
            </p>
            <p className="text-xs text-muted-foreground">
              Set up category budgets to track spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  alert('Clearing all activity...')
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
          <CardContent>
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No recent activity.
            </div>
          </CardContent>
        </Card>

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
