
import type { BudgetItem } from '../projects/[id]/budget-data';
import type { Expense } from '../projects/[id]/expenses-data';
import type { ReimbursableExpense } from '../projects/[id]/get-reimbursed-data';
import type { Milestone } from '../projects/[id]/milestones-data';
import type { Drawing } from '../projects/[id]/drawings-data';
import type { ScheduleItem } from '../projects/[id]/schedule-data';
import type { ClientUpload } from '../projects/[id]/client-uploads-data';

export type ChangeOrder = {
  id: string;
  coNumber: string;
  dateInitiated: string;
  description: string;
  status: 'Submitted' | 'Approved' | 'Rejected' | 'Pending';
  amount: number;
  vendor?: string;
  reason?: string;
  scheduleImpact?: string;
};

export type ApplicationLine = {
  id: string;
  sovId: string;
  description: string;
  scheduledValue: number;
  workCompletedThisPeriod: number;
  materialsStored: number;
  totalCompletedAndStored: number;
  retainagePercent: number;
  totalRetainage: number;
  balanceToFinish: number;
};

export type Application = {
  id: string;
  applicationNumber: number;
  periodStart: string;
  periodEnd: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Paid';
  g703Lines: ApplicationLine[];
};



export type Project = {
    id: string;
    name: string;
    client: string;
    status: 'Active' | 'Planning' | 'Completed' | 'On Hold';
    progress: number;
    startDate: string;
    endDate: string;
    budget: number;
    spent: number;
    imageUrl: string;
    imageHint: string;
    team: { id: string; fallback: string; imageUrl: string }[];
    streetAddress?: string;
    city?: string;
    zipCode?: string;
    description?: string;
    finalBid?: number;
    budgetData: BudgetItem[];
    expensesData: Expense[];
    getReimbursedData: ReimbursableExpense[];
    milestonesData: Milestone[];
    drawingsData: Drawing[];
    scheduleData: ScheduleItem[];
    clientUploadsData: ClientUpload[];
    changeOrdersData: ChangeOrder[];
    applicationsData: Application[];
};

export const projectsData: Project[] = [];
