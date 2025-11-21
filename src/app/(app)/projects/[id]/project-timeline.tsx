'use client';

import React, { useMemo } from 'react';
import type { Project } from '../projects-data';

type ProjectTimelineProps = {
  project: Project;
  totalBudget: number;
  totalSpent: number;
  committedTotal?: number;
  finalBidFromBudget: number; // sum of Final Bid to Customer from Budget tab
};

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ProjectTimeline({
  project,
  totalBudget,
  totalSpent,
  committedTotal = 0,
  finalBidFromBudget,
}: ProjectTimelineProps) {
  const start = parseDate(project.startDate);
  const end = parseDate(project.endDate);

  const { totalDays, daysPassed, daysLeft, progressPctBySchedule } =
    useMemo(() => {
      if (!start || !end) {
        return { totalDays: 0, daysPassed: 0, daysLeft: 0, progressPctBySchedule: 0 };
      }
      const now = new Date();
      const msTotal = end.getTime() - start.getTime();
      const msPassed = now.getTime() - start.getTime();
      const total = Math.max(0, Math.round(msTotal / (1000 * 60 * 60 * 24)));
      const passed = Math.min(total, Math.max(0, Math.round(msPassed / (1000 * 60 * 60 * 24))));
      const left = Math.max(0, total - passed);
      const pct = total > 0 ? (passed / total) * 100 : 0;
      return { totalDays: total, daysPassed: passed, daysLeft: left, progressPctBySchedule: pct };
    }, [start, end]);

  const displayTotalBudget = committedTotal > 0 ? committedTotal : totalBudget;

  const potentialProfit = finalBidFromBudget - displayTotalBudget; // Customer Bid - Our Cost
  const actualProfit = finalBidFromBudget - totalSpent;           // Customer Bid - Current Cost

  const progressBudgetPct =
    displayTotalBudget > 0 ? (totalSpent / displayTotalBudget) * 100 : 0;

  const profitColor =
    actualProfit > 0 ? 'text-emerald-600' : actualProfit < 0 ? 'text-red-600' : '';

  return (
    <div className="space-y-4">
      {/* Top cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Final Bid to Customer */}
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Final Bid to Customer
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {formatCurrency(finalBidFromBudget)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Sum of &ldquo;Final Bid to Customer&rdquo; from Budget.
          </div>
        </div>

        {/* Total Budget (cost) */}
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Total Budget (cost)
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {formatCurrency(displayTotalBudget)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Internal cost estimate (from Budget).
          </div>
        </div>

        {/* Spent to Date */}
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Spent to Date
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {formatCurrency(totalSpent)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {displayTotalBudget > 0
              ? `${progressBudgetPct.toFixed(1)}% of Budget`
              : 'No budget entered yet.'}
          </div>
        </div>

        {/* Profit / Loss */}
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Profit / Loss
          </div>
          <div className={`mt-2 text-2xl font-semibold ${profitColor}`}>
            {formatCurrency(actualProfit)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Potential Profit: {formatCurrency(potentialProfit)} — Customer Bid - Our Cost
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Actual Profit/Loss: {formatCurrency(actualProfit)} — Customer Bid - Current Cost
          </div>
        </div>
      </div>

      {/* Schedule bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Schedule &amp; Status</span>
            {totalDays > 0 && (
              <>
                {' · '}Total Days: {totalDays} · Days Passed: {daysPassed} · Days Left:{' '}
                {daysLeft}
              </>
            )}
          </div>
          <div>
            Progress: {project.progress ?? 0}% complete
          </div>
        </div>

        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-primary"
            style={{ width: `${progressPctBySchedule.toFixed(1)}%` }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <div>{start ? start.toLocaleDateString() : 'Start date not set'}</div>
          <div>{end ? end.toLocaleDateString() : 'End date not set'}</div>
        </div>
      </div>
    </div>
  );
}
