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

  /**
   * Schedule metrics, mirroring the dashboard timeline logic
   * - totalDays: planned duration (start → end)
   * - daysPassed: days from start → today (can exceed totalDays)
   * - daysLeft: days remaining until end (0 if overdue)
   * - overdueDays: days past end (0 if still on time)
   * - progressPctBySchedule: 0–100%, clamped for bar width
   */
  const { totalDays, daysPassed, daysLeft, overdueDays, progressPctBySchedule } =
    useMemo(() => {
      if (!start || !end) {
        return {
          totalDays: 0,
          daysPassed: 0,
          daysLeft: 0,
          overdueDays: 0,
          progressPctBySchedule: 0,
        };
      }

      const now = new Date();
      const dayMs = 1000 * 60 * 60 * 24;

      const msTotal = end.getTime() - start.getTime();
      const msSinceStart = now.getTime() - start.getTime();

      const total = Math.max(0, Math.round(msTotal / dayMs));

      // Raw days from start until today (can be > total if overdue)
      const passedRaw = Math.max(0, Math.round(msSinceStart / dayMs));

      // For the bar we clamp to the total so it never exceeds 100%
      const passedClamped = total > 0 ? Math.min(passedRaw, total) : 0;

      const overdue = total > 0 ? Math.max(0, passedRaw - total) : 0;
      const remaining = total > 0 ? Math.max(0, total - passedRaw) : 0;

      const pct =
        total > 0 ? (passedClamped / total) * 100 : 0;

      return {
        totalDays: total,
        daysPassed: passedRaw,
        daysLeft: remaining,
        overdueDays: overdue,
        progressPctBySchedule: pct,
      };
    }, [start, end]);

  const displayTotalBudget = committedTotal > 0 ? committedTotal : totalBudget;

  const potentialProfit = finalBidFromBudget - displayTotalBudget; // Customer Bid - Our Cost
  const actualProfit = finalBidFromBudget - totalSpent; // Customer Bid - Current Cost

  const progressBudgetPct =
    displayTotalBudget > 0 ? (totalSpent / displayTotalBudget) * 100 : 0;

  const profitColor =
    actualProfit > 0 ? 'text-emerald-600' : actualProfit < 0 ? 'text-red-600' : '';

  // --- NEW: bar color, matching dashboard logic ---
  const barColor =
    overdueDays > 0
      ? 'bg-red-500'
      : project.status === 'Completed'
      ? 'bg-emerald-500'
      : 'bg-sky-500';

  // Date labels in MM/DD/YYYY
  const startLabel = start ? start.toLocaleDateString('en-US') : 'Start date not set';
  const endLabel = end ? end.toLocaleDateString('en-US') : 'End date not set';

  // Right-hand label with total + remaining/overdue
  const rightLabel =
    totalDays > 0
      ? overdueDays > 0
        ? `Total: ${totalDays} – Overdue: ${overdueDays} days`
        : `Total: ${totalDays} – Remaining: ${daysLeft} days`
      : 'Schedule not set';

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
        {/* Header line: schedule summary + manual progress */}
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
          <div>Progress: {project.progress ?? 0}% complete</div>
        </div>

        {/* Labels above the bar (like dashboard timeline) */}
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{startLabel}</span>
          <span>Today: {daysPassed} days</span>
          <span className="text-right">{rightLabel}</span>
        </div>

        {/* Colored schedule bar */}
        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`absolute inset-y-0 left-0 ${barColor}`}
            style={{ width: `${progressPctBySchedule.toFixed(1)}%` }}
          />
        </div>

        {/* End date label below the bar */}
        <div className="mt-2 flex justify-center text-xs text-muted-foreground">
          <span>End: {endLabel}</span>
        </div>
      </div>
    </div>
  );
}
