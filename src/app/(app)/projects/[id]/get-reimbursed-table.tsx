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
  // This comes in already filtered so that Category === "Get Reimbursed"
  expenses?: Expense[] | null;
};

export function GetReimbursedTable({ expenses }: Props) {
  const [rows, setRows] = React.useState<Expense[]>(() => (expenses ?? []) as Expense[]);

  React.useEffect(() => {
    setRows((expenses ?? []) as Expense[]);
  }, [expenses]);

  const totalAmount = React.useMemo(
    () =>
      rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [rows],
  );

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
        : `gr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const amountNum = Number(
      form.amount.replace?.(/[\$,]/g, '') ?? form.amount,
    ) || 0;

    const newRow: Expense = {
      id,
      date: form.date,
      category: 'Get Reimbursed',
      vendor: form.vendor,
      description: form.description,
      amount: amountNum,
    } as Expense;

    setRows((prev) => [...prev, newRow]);
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Add Get Reimbursed dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Reimbursable Expense</DialogTitle>
            <DialogDescription>
              Log a reimbursable expense to claim back from the client.
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
                placeholder="Describe the reimbursable expense"
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
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-slate-50 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Get Reimbursed</h2>
          <p className="text-xs text-slate-500">
            Expenses that should be billed back to the client.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1 font-medium hover:bg-slate-100"
            onClick={() =>
              alert('Import for Get Reimbursed can be wired later.')
            }
          >
            ⬆️ <span>Import</span>
          </button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenAdd}
          >
            + Add Reimbursable
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
                  No reimbursable expenses yet. Click &quot;Add
                  Reimbursable&quot; to log one.
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
