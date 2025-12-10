'use client';

import * as React from 'react';

import * as XLSX from 'xlsx';


import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { Expense } from './expenses-data';

type Props = {
  initialData?: Expense[] | null;
  onDataChange?: (rows: Expense[]) => void;
};

type NewExpenseForm = {
  date: string;
  vendor: string;
  category: string;
  description: string;
  amount: string;
  paymentMethod: string;
  invoiceNumber: string;
  reference: string;
};



const numberOrZero = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function ExpensesTable({ initialData, onDataChange }: Props) {
  // main rows
  const [rows, setRows] = React.useState<Expense[]>(
    () => (initialData ?? []) as Expense[],
  );

  // helper: update rows + notify parent in one place
  const setRowsAndNotify = React.useCallback(
    (updater: (prev: Expense[]) => Expense[]) => {
      setRows((prev) => {
        const next = updater(prev);
        if (onDataChange) {
          onDataChange(next);
        }
        return next;
      });
    },
    [onDataChange],
  );

  // controls / filters
  const [groupByCategory, setGroupByCategory] = React.useState(false);
  const [vendorFilter, setVendorFilter] = React.useState<string>('All Vendors');
  const [categoryFilter, setCategoryFilter] =
    React.useState<string>('All Categories');

  // external lists from other pages (Vendors + Budget Categories)
  const [externalVendors, setExternalVendors] = React.useState<string[]>([]);
  const [externalCategories, setExternalCategories] = React.useState<string[]>(
    [],
  );

  // selection + editing
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [editingRowId, setEditingRowId] = React.useState<string | null>(null);

  // add-expense dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newExpense, setNewExpense] = React.useState<NewExpenseForm>(() => ({
    date: new Date().toISOString().slice(0, 10),
    vendor: '',
    category: '',
    description: '',
    amount: '',
    paymentMethod: '',
    invoiceNumber: '',
    reference: '',
  }));

  // file input for Import
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // ─────────────────────────────────────────────
  // Load Vendors + Budget Categories from localStorage
  // ─────────────────────────────────────────────
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vendors (from /vendors page)
    try {
      const savedVendors = window.localStorage.getItem('vendors');
      if (savedVendors) {
        const parsed = JSON.parse(savedVendors);
        const names = Array.isArray(parsed)
          ? parsed
              .map((v: any) =>
                (v.name ?? v.vendorName ?? v.companyName ?? '')
                  .toString()
                  .trim(),
              )
              .filter(Boolean)
          : [];
        setExternalVendors(Array.from(new Set(names)));
      }
    } catch (err) {
      console.error('Failed to read vendors from localStorage', err);
    }

    // Budget categories (from /budget-categories page)
    try {
      const savedCats = window.localStorage.getItem('budgetCategories');
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        const names = Array.isArray(parsed)
          ? parsed
              .map((c: any) =>
                (c.name ?? c.category ?? '').toString().trim(),
              )
              .filter(Boolean)
          : [];
        setExternalCategories(Array.from(new Set(names)));
      }
    } catch (err) {
      console.error('Failed to read budget categories from localStorage', err);
    }
  }, []);

  // ─────────────────────────────────────────────
  // Options for filters
  // ─────────────────────────────────────────────
  const vendorOptions = React.useMemo(
    () =>
      Array.from(
        new Set([
          ...externalVendors,
          ...rows
            .map((r) => r.vendor)
            .filter((v): v is string => Boolean(v && v.trim())),
        ]),
      ),
    [rows, externalVendors],
  );

  const categoryOptions = React.useMemo(
    () =>
      Array.from(
        new Set([
          ...externalCategories,
          ...rows
            .map((r) => r.category)
            .filter((c): c is string => Boolean(c && c.trim())),
        ]),
      ),
    [rows, externalCategories],
  );

  // ─────────────────────────────────────────────
  // Filtered rows & totals
  // ─────────────────────────────────────────────
  const filteredRows = React.useMemo(
    () =>
      rows.filter((r) => {
        if (vendorFilter !== 'All Vendors' && r.vendor !== vendorFilter) {
          return false;
        }
        if (
          categoryFilter !== 'All Categories' &&
          r.category !== categoryFilter
        ) {
          return false;
        }
        return true;
      }),
    [rows, vendorFilter, categoryFilter],
  );

  const totalAmount = React.useMemo(
    () =>
      filteredRows.reduce((sum, r) => sum + numberOrZero(r.amount), 0),
    [filteredRows],
  );

  // grouped view
  const groupedRows = React.useMemo(() => {
    if (!groupByCategory) return null;

    const groups = new Map<string, { total: number; rows: Expense[] }>();

    for (const r of filteredRows) {
      const key = (r.category || 'Uncategorized').toString();
      const entry = groups.get(key) ?? { total: 0, rows: [] };
      entry.rows.push(r);
      entry.total += numberOrZero(r.amount);
      groups.set(key, entry);
    }

    return Array.from(groups.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [filteredRows, groupByCategory]);

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const updateRow = (id: string, patch: Partial<Expense>) => {
    setRowsAndNotify((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const handleDeleteRow = (id: string) => {
    setRowsAndNotify((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const toDelete = new Set(selectedIds);
    setRowsAndNotify((prev) => prev.filter((r) => !toDelete.has(r.id)));
    setSelectedIds([]);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const data = event.target?.result;
      if (!data) return;

      // Read workbook
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON rows (keys from header row)
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
      });

      const imported: Expense[] = json.map((row, index) => {
        // Column names must match your header row
        const date = row['Date'] || row['date'] || '';
        const category = row['Category'] || row['category'] || '';
        const vendor = row['Vendor'] || row['vendor'] || '';
        const description =
          row['Description'] || row['description'] || '';
        const paymentMethod =
          row['Payment Method'] ||
          row['PaymentMethod'] ||
          row['paymentMethod'] ||
          '';
        const reference = row['Reference'] || row['reference'] || '';
        const invoiceNumber =
          row['Invoice #'] ||
          row['Invoice#'] ||
          row['Invoice'] ||
          row['invoiceNumber'] ||
          '';
        const amountRaw =
          row['Amount'] || row['amount'] || row['AMOUNT'] || 0;

        const amountNum =
          typeof amountRaw === 'string'
            ? Number(
                amountRaw
                  .replace(/[\$,]/g, '')
                  .trim(),
              ) || 0
            : Number(amountRaw) || 0;

        const id =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `imp-${Date.now()}-${index}`;

        return {
          id,
          date: date?.toString() ?? '',
          category: category?.toString() ?? '',
          vendor: vendor?.toString() ?? '',
          description: description?.toString() ?? '',
          paymentMethod: paymentMethod?.toString() ?? '',
          reference: reference?.toString() ?? '',
          invoiceNumber: invoiceNumber?.toString() ?? '',
          amount: amountNum,
        } as Expense;
      });

      // Append to existing rows and notify parent
      setRowsAndNotify((prev) => [...prev, ...imported]);
    } catch (err) {
      console.error('Failed to parse XLSX file:', err);
      alert('Could not parse this Excel file. Check column headers.');
    }
  };

  reader.onerror = () => {
    alert('Error reading file.');
  };

  reader.readAsArrayBuffer(file);

  // Allow choosing the same file again
  e.target.value = '';
};




  const handleOpenAddDialog = () => {
    setNewExpense({
      date: new Date().toISOString().slice(0, 10),
      vendor: '',
      category: '',
      description: '',
      amount: '',
      paymentMethod: '',
      invoiceNumber: '',
      reference: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleSaveNewExpense = () => {
    if (!newExpense.date || !newExpense.category) {
      alert('Please enter at least a date and category.');
      return;
    }

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const amountNum = numberOrZero(newExpense.amount);

    const expense: Expense = {
      id,
      date: newExpense.date,
      vendor: newExpense.vendor,
      category: newExpense.category,
      description: newExpense.description,
      amount: amountNum,
      paymentMethod: newExpense.paymentMethod as any,
      invoiceNumber: newExpense.invoiceNumber as any,
      reference: newExpense.reference as any,
    } as any;

    setRowsAndNotify((prev) => [...prev, expense]);
    setIsAddDialogOpen(false);
  };

  // select-all checkbox helper
  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every((r) => selectedIds.includes(r.id));

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Log a new expense for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Date
              </label>
              <Input
                type="date"
                className="mt-1"
                value={newExpense.date}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Vendor (Optional)
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={newExpense.vendor}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    vendor: e.target.value,
                  }))
                }
              >
                <option value="">Select a vendor</option>
                {vendorOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Category
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              >
                <option value="">Select a category</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Description
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="e.g., Concrete Mix"
                value={newExpense.description}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Amount
              </label>
              <Input
                className="mt-1"
                type="number"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Payment Method
              </label>
              <Input
                className="mt-1"
                placeholder="e.g., Credit Card"
                value={newExpense.paymentMethod}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
              />
            </div>

            {/* Invoice # */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Invoice # (Optional)
              </label>
              <Input
                className="mt-1"
                placeholder="e.g., INV-124"
                value={newExpense.invoiceNumber}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    invoiceNumber: e.target.value,
                  }))
                }
              />
            </div>

            {/* Reference */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Reference
              </label>
              <Input
                className="mt-1"
                placeholder="e.g., check number"
                value={newExpense.reference}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNewExpense}>Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header + toolbar */}
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold">Daily Expenses</h2>
          <p className="text-xs text-slate-500">
            Log and track daily expenses for this project.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-slate-50 px-4 py-3">
          {/* left side: group toggle + total */}
          <div className="flex items-center gap-6 text-xs">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={groupByCategory}
                onChange={(e) =>
                  setGroupByCategory(e.target.checked)
                }
              />
              <span>Group by Category</span>
            </label>
            <span className="font-medium">
              Total:{' '}
              {totalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* right side: filters + actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* vendor filter */}
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
            >
              <option>All Vendors</option>
              {vendorOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* category filter */}
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option>All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* hidden file input for Import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChosen}
            />

            <Button
              type="button"
              variant="outline"
              onClick={handleImportClick}
            >
              Import
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={selectedIds.length === 0}
              onClick={handleDeleteSelected}
            >
              Delete Selected
            </Button>

            <Button type="button" onClick={handleOpenAddDialog}>
              + Add Expense
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  aria-label="Select all"
                  checked={
                    filteredRows.length > 0 && allVisibleSelected
                  }
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    const visibleIds = filteredRows.map((r) => r.id);
                    if (isChecked) {
                      setSelectedIds((prev) =>
                        Array.from(new Set([...prev, ...visibleIds])),
                      );
                    } else {
                      setSelectedIds((prev) =>
                        prev.filter((id) => !visibleIds.includes(id)),
                      );
                    }
                  }}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right w-[80px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-6 text-center text-sm text-slate-500"
                >
                  No expenses found. Click &quot;Import&quot; or
                  &quot;Add Expense&quot; to get started.
                </TableCell>
              </TableRow>
            ) : groupByCategory && groupedRows ? (
              groupedRows.map(([category, group]) => (
                <React.Fragment key={category}>
                  {/* category header row */}
                  <TableRow className="bg-slate-50">
                    <TableCell />
                    <TableCell colSpan={7} className="font-semibold">
                      {category || 'Uncategorized'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      $
                      {group.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell />
                  </TableRow>

                  {group.rows.map((row) => {
                    const isEditing = editingRowId === row.id;
                    const isSelected = selectedIds.includes(row.id);

                    return (
                      <TableRow key={row.id}>
                        {/* checkbox */}
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const c = !!checked;
                              setSelectedIds((prev) =>
                                c
                                  ? Array.from(
                                      new Set([...prev, row.id]),
                                    )
                                  : prev.filter((id) => id !== row.id),
                              );
                            }}
                            aria-label="Select row"
                          />
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={row.date ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, {
                                  date: e.target.value,
                                })
                              }
                            />
                          ) : (
                            row.date || '-'
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={row.category ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, {
                                  category: e.target.value,
                                })
                              }
                            />
                          ) : (
                            row.category || '-'
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={row.vendor ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, {
                                  vendor: e.target.value,
                                })
                              }
                            />
                          ) : (
                            row.vendor || '-'
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={row.description ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, {
                                  description: e.target.value,
                                })
                              }
                            />
                          ) : (
                            row.description || '-'
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={(row as any).paymentMethod ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, {
                                  paymentMethod: e.target.value as any,
                                })
                              }
                            />
                          ) : (
                            (row as any).paymentMethod || '-'
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={(row as any).reference ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, {
                                  reference: e.target.value as any,
                                })
                              }
                            />
                          ) : (
                            (row as any).reference || '-'
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={(row as any).invoiceNumber ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, {
                                  invoiceNumber:
                                    e.target.value as any,
                                })
                              }
                            />
                          ) : (
                            (row as any).invoiceNumber || '-'
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              className="h-8 text-right"
                              type="number"
                              value={row.amount ?? 0}
                              onChange={(e) =>
                                updateRow(row.id, {
                                  amount: numberOrZero(
                                    e.target.value,
                                  ),
                                })
                              }
                            />
                          ) : (
                            <>
                              $
                              {numberOrZero(
                                row.amount,
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 px-0"
                              >
                                ⋯
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isEditing ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditingRowId(null)
                                  }
                                >
                                  Done Editing
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditingRowId(row.id)
                                  }
                                >
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() =>
                                  handleDeleteRow(row.id)
                                }
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))
            ) : (
              // flat view (no grouping)
              filteredRows.map((row) => {
                const isEditing = editingRowId === row.id;
                const isSelected = selectedIds.includes(row.id);

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const c = !!checked;
                          setSelectedIds((prev) =>
                            c
                              ? Array.from(
                                  new Set([...prev, row.id]),
                                )
                              : prev.filter((id) => id !== row.id),
                          );
                        }}
                        aria-label="Select row"
                      />
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          className="h-8"
                          value={row.date ?? ''}
                          onChange={(e) =>
                            updateRow(row.id, {
                              date: e.target.value,
                            })
                          }
                        />
                      ) : (
                        row.date || '-'
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          className="h-8"
                          value={row.category ?? ''}
                          onChange={(e) =>
                            updateRow(row.id, {
                              category: e.target.value,
                            })
                          }
                        />
                      ) : (
                        row.category || '-'
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          className="h-8"
                          value={row.vendor ?? ''}
                          onChange={(e) =>
                            updateRow(row.id, {
                              vendor: e.target.value,
                            })
                          }
                        />
                      ) : (
                        row.vendor || '-'
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          className="h-8"
                          value={row.description ?? ''}
                          onChange={(e) =>
                            updateRow(row.id, {
                              description: e.target.value,
                            })
                          }
                        />
                      ) : (
                        row.description || '-'
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          className="h-8"
                          value={(row as any).paymentMethod ?? ''}
                          onChange={(e) =>
                            updateRow(row.id, {
                              paymentMethod: e.target.value as any,
                            })
                          }
                        />
                      ) : (
                        (row as any).paymentMethod || '-'
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          className="h-8"
                          value={(row as any).reference ?? ''}
                          onChange={(e) =>
                            updateRow(row.id, {
                              reference: e.target.value as any,
                            })
                          }
                        />
                      ) : (
                        (row as any).reference || '-'
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          className="h-8"
                          value={(row as any).invoiceNumber ?? ''}
                          onChange={(e) =>
                            updateRow(row.id, {
                              invoiceNumber:
                                e.target.value as any,
                            })
                          }
                        />
                      ) : (
                        (row as any).invoiceNumber || '-'
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={row.amount ?? 0}
                          onChange={(e) =>
                            updateRow(row.id, {
                              amount: numberOrZero(
                                e.target.value,
                              ),
                            })
                          }
                        />
                      ) : (
                        <>
                          $
                          {numberOrZero(
                            row.amount,
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 px-0"
                          >
                            ⋯
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isEditing ? (
                            <DropdownMenuItem
                              onClick={() =>
                                setEditingRowId(null)
                              }
                            >
                              Done Editing
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                setEditingRowId(row.id)
                              }
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteRow(row.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

