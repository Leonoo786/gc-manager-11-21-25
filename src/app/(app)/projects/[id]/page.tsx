'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { BudgetTable } from './budget-table';
import { SpendingCategoriesTable } from './spending-categories-table';
import { ExpensesTable } from './expenses-table';
import { ChangeOrdersTable } from './change-orders-table';
import { GetReimbursedTable } from './get-reimbursed-table';
import { MilestonesList } from './milestones-list';
import { DrawingsTable } from './drawings-table';
import { ScheduleTable } from './schedule-table';
import { RfisTable } from './rfis-table';
import { ClientUploadsTable } from './client-uploads-table';
import { ApplicationsTable } from './applications-table';
import { ProjectTimeline } from './project-timeline';
// import { ProjectEditDialog } from './project-edit-dialog'; // (unused right now)

import type {
  Project,
  ChangeOrder,
  ClientUpload,
  ReimbursableExpense,
  Application,
} from '../projects-data';
import type { BudgetItem } from './budget-data';
import type { Expense } from './expenses-data';

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // ---------- Load project from localStorage ----------
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('projects');
      const projects: Project[] = savedProjects ? JSON.parse(savedProjects) : [];
      const currentProject = projects.find((p) => p.id === id) || null;
      setProject(currentProject as Project | null);
    }
    setIsMounted(true);
  }, [id]);

  // Helper to persist project back to localStorage
  const updateProjectData = (updatedProject: Project) => {
    setProject(updatedProject);
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('projects');
      const projects: Project[] = savedProjects ? JSON.parse(savedProjects) : [];
      const updatedProjects = projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
    }
  };

  // ---------- Change-handlers for child tables ----------
  const handleBudgetDataChange = (newBudgetData: BudgetItem[]) => {
    if (!project) return;
    const updatedProject: Project = { ...project, budgetData: newBudgetData };
    updateProjectData(updatedProject);
  };

  const handleExpensesDataChange = (newExpensesData: Expense[]) => {
    if (!project) return;
    const updatedProject: Project = { ...project, expensesData: newExpensesData };
    updateProjectData(updatedProject);
  };

  const handleChangeOrdersDataChange = (newChangeOrdersData: ChangeOrder[]) => {
    if (!project) return;
    const updatedProject: Project = {
      ...project,
      changeOrdersData: newChangeOrdersData,
    };
    updateProjectData(updatedProject);
  };

  const handleGetReimbursedDataChange = (
    newGetReimbursedData: ReimbursableExpense[],
  ) => {
    if (!project) return;
    const updatedProject: Project = {
      ...project,
      getReimbursedData: newGetReimbursedData,
    };
    updateProjectData(updatedProject);
  };

  const handleClientUploadsDataChange = (newClientUploadsData: ClientUpload[]) => {
    if (!project) return;
    const updatedProject: Project = {
      ...project,
      clientUploadsData: newClientUploadsData,
    };
    updateProjectData(updatedProject);
  };

  const handleApplicationsDataChange = (newApplicationsData: Application[]) => {
    if (!project) return;
    const updatedProject: Project = {
      ...project,
      applicationsData: newApplicationsData,
    };
    updateProjectData(updatedProject);
  };

  const [committedTotal, setCommittedTotal] = useState<number>(0);

  // ---------- Derived totals for header cards ----------
  const { totalBudget, totalSpent } = useMemo(() => {
    if (!project) return { totalBudget: 0, totalSpent: 0 };

    const budget = (project.budgetData ?? []).reduce(
      (acc, item) => acc + (item.originalBudget ?? 0),
      0,
    );

    const spent = (project.expensesData ?? []).reduce(
      (acc, item) => acc + (item.amount ?? 0),
      0,
    );

    return { totalBudget: budget, totalSpent: spent };
  }, [project]);

  // NEW: Sum of "Final Bid to Customer" from Budget tab
  const finalBidFromBudget = useMemo(() => {
    const items = (project?.budgetData ?? []) as BudgetItem[];
    return items.reduce(
      (sum, item) => sum + (item.finalBidToCustomer ?? 0),
      0,
    );
  }, [project?.budgetData]);

  // ---------- Derived views from expenses ----------
  const baseExpenses: Expense[] = useMemo(
    () => (project?.expensesData ?? []) as Expense[],
    [project],
  );

  const reimbursableExpenses: Expense[] = useMemo(
    () =>
      baseExpenses.filter(
        (e) =>
          e.category &&
          e.category.toLowerCase().trim() === 'get reimbursed'.toLowerCase(),
      ),
    [baseExpenses],
  );

  const changeOrderExpenses: Expense[] = useMemo(
    () =>
      baseExpenses.filter(
        (e) =>
          e.category &&
          e.category.toLowerCase().trim() === 'change order'.toLowerCase(),
      ),
    [baseExpenses],
  );

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <Link href="/projects" passHref>
          <Button variant="link">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header – now responsive */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-headline text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
        </div>
        {/* you can add right-side header actions here later if needed */}
      </div>

      {/* Timeline / cards */}
      <div className="space-y-6">
        <ProjectTimeline
          project={project}
          totalBudget={totalBudget}
          totalSpent={totalSpent}
          committedTotal={committedTotal}
          finalBidFromBudget={finalBidFromBudget}
        />
      </div>

      {/* Tabs – TabsList made horizontally scrollable on mobile */}
      <Tabs defaultValue="report">
        <div className="mb-4 overflow-x-auto">
          <TabsList className="mb-4 flex-wrap justify-start">
            <TabsTrigger value="report">Report</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
            <TabsTrigger value="get-reimbursed">Get Reimbursed</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="drawings">Drawings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="rfis">RFIs</TabsTrigger>
            <TabsTrigger value="client-uploads">Client Uploads</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="report">
          <SpendingCategoriesTable
            expenses={project.expensesData}
            budgetItems={project.budgetData}
          />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTable
            initialData={project.budgetData}
            onDataChange={handleBudgetDataChange}
            onCommittedTotalChange={setCommittedTotal}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTable
            initialData={project.expensesData}
            onDataChange={handleExpensesDataChange}
          />
        </TabsContent>

        <TabsContent value="change-orders">
          <ChangeOrdersTable expenses={changeOrderExpenses} />
        </TabsContent>

        <TabsContent value="get-reimbursed">
          <GetReimbursedTable expenses={reimbursableExpenses} />
        </TabsContent>

        <TabsContent value="milestones">
          <MilestonesList initialData={project.milestonesData} />
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsTable
            initialData={project.applicationsData || []}
            onDataChange={handleApplicationsDataChange}
            project={project}
          />
        </TabsContent>

        <TabsContent value="drawings">
          <DrawingsTable initialData={project.drawingsData} />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleTable initialData={project.scheduleData} />
        </TabsContent>

        <TabsContent value="rfis">
          <RfisTable />
        </TabsContent>

        <TabsContent value="client-uploads">
          <ClientUploadsTable
            initialData={project.clientUploadsData}
            onDataChange={handleClientUploadsDataChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
