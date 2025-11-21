'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Expense } from './expenses-data';

type Props = {
  // This comes in already filtered so that Category === "Change Order"
  expenses?: Expense[] | null;
};

export function ChangeOrdersTable({ expenses }: Props) {
  const rows = (expenses ?? []) as Expense[];

  const totalAmount = rows.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Top bar with total on the right */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Change Orders</h2>
        <div className="text-sm font-semibold">
          Total:&nbsp;
          <span className="tabular-nums">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm">
                  No change order expenses found for this project.
                </TableCell>
              </TableRow>
            )}

            {rows.map((row, idx) => (
              <TableRow key={row.id ?? idx}>
                <TableCell>{row.date ?? ''}</TableCell>
                <TableCell>{row.vendor ?? ''}</TableCell>
                <TableCell>{row.category ?? ''}</TableCell>
                <TableCell>{row.description ?? ''}</TableCell>
                <TableCell className="text-right">
                  {(Number(row.amount) || 0).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
