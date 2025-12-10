'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import type { Expense } from './expenses-data';

type Props = {
  // This comes in already filtered so that Category === "Change Order"
  expenses?: Expense[] | null;
};

export function ChangeOrdersTable({ expenses }: Props) {
  // Local rows, seeded from props
  const [rows, setRows] = React.useState<Expense[]>(() => (expenses ?? []) as Expense[]);

  // Keep local rows in sync if props change
  React.useEffect(() => {
    setRows((expenses ?? []) as Expense[]);
  }, [expenses]);

  const totalAmount = React.useMemo(
    () =>
      rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [rows],
  );

  // Add-Change-Order dialog state
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    date: '',
    vendor: '',
    description: '',
    amount: '',
  });

  const handleOpenAdd = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      vendor: '',
      description: '',
      amount: '',
    });
    setIsAddOpen(true);
  };

  const handleSaveAdd = () => {
    if (!form.date || !form.description) {
      alert('Please enter at least Date and Description.');
      return;
    }

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `co-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const amountNum = Number(
      form.amount.replace?.(/[\$,]/g, '') ?? form.amount,
    ) || 0;

    const newRow: Expense = {
      id,
      date: form.date,
      category: 'Change Order',
      vendor: form.vendor,
      description: form.description,
      amount: amountNum,
    } as Expense;

    setRows((prev) => [...prev, newRow]);
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Add Change Order dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Change Order</DialogTitle>
            <DialogDescription>
              Create a new change-order expense for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-slate-700">
                Date
              </label>
              <Input
                type="date"
                className="mt-1 h-8 text-sm"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">
                Vendor
              </label>
              <Input
                className="mt-1 h-8 text-sm"
                placeholder="Vendor name"
                value={form.vendor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendor: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">
                Description
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="Describe the change order"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">
                Amount
              </label>
              <Input
                className="mt-1 h-8 text-sm"
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveAdd}>
              Save Change Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-slate-50 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Change Orders</h2>
          <p className="text-xs text-slate-500">
            Track submitted, approved, and rejected change orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Import left as a stub for now */}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1 font-medium hover:bg-slate-100"
            onClick={() => alert('Import for Change Orders can be wired later.')}
          >
            ⬆️ <span>Import</span>
          </button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenAdd}
          >
            + Add Change Order
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right w-[140px]">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-6 text-center text-sm text-slate-500"
                >
                  No change orders yet. Click &quot;Add Change Order&quot; to
                  create one.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date || '-'}</TableCell>
                    <TableCell>{row.vendor || '-'}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate">
                        {row.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      $
                      {(Number(row.amount) || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total row */}
                <TableRow className="bg-slate-50 font-semibold">
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right">
                    Total
                  </TableCell>
                  <TableCell className="text-right">
                    $
                    {totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
