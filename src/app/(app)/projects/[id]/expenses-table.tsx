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

type SortKey =
  | 'date'
  | 'category'
  | 'vendor'
  | 'description'
  | 'paymentMethod'
  | 'reference'
  | 'invoiceNumber'
  | 'amount';

type SortDir = 'asc' | 'desc';

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

function toNumberSafe(v: unknown): number {
  const n =
    typeof v === 'number'
      ? v
      : Number(String(v ?? '').replace(/[$,]/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

// Accepts: ISO string, any string date, Excel serial like 45879
function toDateMs(v: unknown): number {
  if (v == null) return 0;

  // Excel serial number (most common: 30k–60k)
  const n = Number(v);
  if (!Number.isNaN(n) && n > 30000 && n < 60000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return excelEpoch + n * 86400000;
  }

  const s = String(v).trim();
  if (!s) return 0;

  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : 0;
}

function compareText(a: unknown, b: unknown) {
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, {
    sensitivity: 'base',
  });
}

function excelSerialToISO(serial: number) {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const ms = serial * 24 * 60 * 60 * 1000;
  const d = new Date(excelEpoch.getTime() + ms);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function normalizeExpenseDate(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 30000 && value < 60000) return excelSerialToISO(value);
    return String(value);
  }
  const s = String(value).trim();
  if (!s) return '';
  const n = Number(s);
  if (!Number.isNaN(n) && n > 30000 && n < 60000) return excelSerialToISO(n);

  // If it's already "YYYY-MM-DD", convert to "MM-DD-YYYY"
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}-${m[3]}-${m[1]}`; // MM-DD-YYYY

  return s;
}

function displayExpenseDate(value: unknown): string {
  const iso = normalizeExpenseDate(value); // returns YYYY-MM-DD (or best effort)
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}-${m[3]}-${m[1]}`; // MM-DD-YYYY
  return iso || '-';
}


function SortHeader({
  label,
  sortKey,
  kind,
  sort,
  setSort,
}: {
  label: string;
  sortKey: SortKey;
  kind: 'text' | 'date' | 'amount';
  sort: { key: SortKey; dir: SortDir } | null;
  setSort: React.Dispatch<
    React.SetStateAction<{ key: SortKey; dir: SortDir } | null>
  >;
}) {
  const isActive = sort?.key === sortKey;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-7 px-2 text-xs">
          {label}
          {isActive ? (sort?.dir === 'asc' ? ' ↑' : ' ↓') : ''}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {kind === 'text' && (
          <>
            <DropdownMenuItem
              onClick={() => setSort({ key: sortKey, dir: 'asc' })}
            >
              A → Z
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSort({ key: sortKey, dir: 'desc' })}
            >
              Z → A
            </DropdownMenuItem>
          </>
        )}

        {kind === 'date' && (
          <>
            <DropdownMenuItem
              onClick={() => setSort({ key: sortKey, dir: 'asc' })}
            >
              Older → Newer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSort({ key: sortKey, dir: 'desc' })}
            >
              Newer → Older
            </DropdownMenuItem>
          </>
        )}

        {kind === 'amount' && (
          <>
            <DropdownMenuItem
              onClick={() => setSort({ key: sortKey, dir: 'asc' })}
            >
              Small → Large
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSort({ key: sortKey, dir: 'desc' })}
            >
              Large → Small
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuItem onClick={() => setSort(null)}>
          Clear Sort
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const numberOrZero = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function ExpensesTable({ initialData, onDataChange }: Props) {
  // --- main rows ---
  const [rows, setRows] = React.useState<Expense[]>(
    () => (initialData ?? []) as Expense[],
  );

  const syncingFromParentRef = React.useRef(false);

  // keep local rows in sync if initialData prop changes
  React.useEffect(() => {
    syncingFromParentRef.current = true;
    setRows((initialData ?? []) as Expense[]);
  }, [initialData]);

  // helper used by buttons / editors, ONLY updates local state
  const setRowsAndNotify = React.useCallback(
    (updater: (prev: Expense[]) => Expense[]) => {
      setRows((prev) => updater(prev));
    },
    [],
  );

  // AFTER rows change, notify parent (ProjectDetailsPage)
  React.useEffect(() => {
    if (syncingFromParentRef.current) {
      syncingFromParentRef.current = false;
      return;
    }
    onDataChange?.(rows);
  }, [rows, onDataChange]);

  // controls / filters
  const [groupByCategory, setGroupByCategory] = React.useState(false);
  const [vendorFilter, setVendorFilter] = React.useState<string>('All Vendors');
  const [categoryFilter, setCategoryFilter] =
    React.useState<string>('All Categories');

  // sorting (MUST be inside component)
  const [sort, setSort] = React.useState<{ key: SortKey; dir: SortDir } | null>(
    null,
  );

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

    try {
      const savedCats = window.localStorage.getItem('budgetCategories');
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        const names = Array.isArray(parsed)
          ? parsed.map((c: any) => (c.name ?? c.category ?? '').toString().trim()).filter(Boolean)
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
        if (vendorFilter !== 'All Vendors' && r.vendor !== vendorFilter)
          return false;
        if (
          categoryFilter !== 'All Categories' &&
          r.category !== categoryFilter
        )
          return false;
        return true;
      }),
    [rows, vendorFilter, categoryFilter],
  );

  // Sorting applies to the filtered rows (NOT raw rows)
  const visibleRows = React.useMemo(() => {
    let list = [...filteredRows];

    if (sort) {
      const { key, dir } = sort;
      const mul = dir === 'asc' ? 1 : -1;

      list.sort((ra, rb) => {
        const a = (ra as any)[key];
        const b = (rb as any)[key];

        if (key === 'date') return mul * (toDateMs(a) - toDateMs(b));
        if (key === 'amount') return mul * (toNumberSafe(a) - toNumberSafe(b));

        return mul * compareText(a, b);
      });
    }

    return list;
  }, [filteredRows, sort]);

  const totalAmount = React.useMemo(
    () => visibleRows.reduce((sum, r) => sum + numberOrZero(r.amount), 0),
    [visibleRows],
  );

  // grouped view uses visibleRows so it respects sort/filter
  const groupedRows = React.useMemo(() => {
    if (!groupByCategory) return null;

    const groups = new Map<string, { total: number; rows: Expense[] }>();

    for (const r of visibleRows) {
      const key = (r.category || 'Uncategorized').toString();
      const entry = groups.get(key) ?? { total: 0, rows: [] };
      entry.rows.push(r);
      entry.total += numberOrZero(r.amount);
      groups.set(key, entry);
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [visibleRows, groupByCategory]);

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

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        });

        const imported: Expense[] = json.map((row, index) => {
          const dateRaw = row['Date'] || row['date'] || '';
          const category = row['Category'] || row['category'] || '';
          const vendor = row['Vendor'] || row['vendor'] || '';
          const description = row['Description'] || row['description'] || '';
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
          const amountRaw = row['Amount'] || row['amount'] || row['AMOUNT'] || 0;

          const amountNum =
            typeof amountRaw === 'string'
              ? Number(amountRaw.replace(/[\$,]/g, '').trim()) || 0
              : Number(amountRaw) || 0;

          const id =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `imp-${Date.now()}-${index}`;

          return {
            id,
            date: normalizeExpenseDate(dateRaw),
            category: category?.toString() ?? '',
            vendor: vendor?.toString() ?? '',
            description: description?.toString() ?? '',
            paymentMethod: paymentMethod?.toString() ?? '',
            reference: reference?.toString() ?? '',
            invoiceNumber: invoiceNumber?.toString() ?? '',
            amount: amountNum,
          } as Expense;
        });

        setRowsAndNotify((prev) => [...prev, ...imported]);
      } catch (err) {
        console.error('Failed to parse XLSX file:', err);
        alert('Could not parse this Excel file. Check column headers.');
      }
    };

    reader.onerror = () => alert('Error reading file.');
    reader.readAsArrayBuffer(file);

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

  // select-all checkbox helper (uses visibleRows)
  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selectedIds.includes(r.id));

  return (
    <div className="space-y-4">
      {/* Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Log a new expense for this project.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Date</label>
              <Input
                type="date"
                className="mt-1"
                value={newExpense.date}
                onChange={(e) =>
                  setNewExpense((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">
                Vendor (Optional)
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={newExpense.vendor}
                onChange={(e) =>
                  setNewExpense((prev) => ({ ...prev, vendor: e.target.value }))
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

            <div>
              <label className="text-xs font-medium text-slate-600">Category</label>
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense((prev) => ({ ...prev, category: e.target.value }))
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

            <div>
              <label className="text-xs font-medium text-slate-600">Description</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="e.g., Concrete Mix"
                value={newExpense.description}
                onChange={(e) =>
                  setNewExpense((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Amount</label>
              <Input
                className="mt-1"
                type="number"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>

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

            <div>
              <label className="text-xs font-medium text-slate-600">Reference</label>
              <Input
                className="mt-1"
                placeholder="e.g., check number"
                value={newExpense.reference}
                onChange={(e) =>
                  setNewExpense((prev) => ({ ...prev, reference: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
          <div className="flex items-center gap-6 text-xs">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={groupByCategory}
                onChange={(e) => setGroupByCategory(e.target.checked)}
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

          <div className="flex flex-wrap items-center gap-2 text-xs">
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

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChosen}
            />

            <Button type="button" variant="outline" onClick={handleImportClick}>
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
                  checked={visibleRows.length > 0 && allVisibleSelected}
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    const visibleIds = visibleRows.map((r) => r.id);
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

              <TableHead>
                <SortHeader
                  label="Date"
                  sortKey="date"
                  kind="date"
                  sort={sort}
                  setSort={setSort}
                />
              </TableHead>

              <TableHead>
                <SortHeader
                  label="Category"
                  sortKey="category"
                  kind="text"
                  sort={sort}
                  setSort={setSort}
                />
              </TableHead>

              <TableHead>
                <SortHeader
                  label="Vendor"
                  sortKey="vendor"
                  kind="text"
                  sort={sort}
                  setSort={setSort}
                />
              </TableHead>

              <TableHead>
                <SortHeader
                  label="Description"
                  sortKey="description"
                  kind="text"
                  sort={sort}
                  setSort={setSort}
                />
              </TableHead>

              <TableHead>
                <SortHeader
                  label="Payment Method"
                  sortKey="paymentMethod"
                  kind="text"
                  sort={sort}
                  setSort={setSort}
                />
              </TableHead>

              <TableHead>
                <SortHeader
                  label="Reference"
                  sortKey="reference"
                  kind="text"
                  sort={sort}
                  setSort={setSort}
                />
              </TableHead>

              <TableHead>
                <SortHeader
                  label="Invoice #"
                  sortKey="invoiceNumber"
                  kind="text"
                  sort={sort}
                  setSort={setSort}
                />
              </TableHead>

              <TableHead className="text-right">
                <SortHeader
                  label="Amount"
                  sortKey="amount"
                  kind="amount"
                  sort={sort}
                  setSort={setSort}
                />
              </TableHead>

              <TableHead className="text-right w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-6 text-center text-sm text-slate-500"
                >
                  No expenses found. Click &quot;Import&quot; or &quot;Add Expense&quot; to get
                  started.
                </TableCell>
              </TableRow>
            ) : groupByCategory && groupedRows ? (
              groupedRows.map(([category, group]) => (
                <React.Fragment key={category}>
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
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const c = !!checked;
                              setSelectedIds((prev) =>
                                c
                                  ? Array.from(new Set([...prev, row.id]))
                                  : prev.filter((id) => id !== row.id),
                              );
                            }}
                            aria-label="Select row"
                          />
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              type="date"
                              value={displayExpenseDate(row.date) ?? ''}
                              onChange={(e) => updateRow(row.id, { date: e.target.value })}
                            />
                          ) : (
                            displayExpenseDate(row.date)
                          )}
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={row.category ?? ''}
                              onChange={(e) => updateRow(row.id, { category: e.target.value })}
                            />
                          ) : (
                            row.category || '-'
                          )}
                        </TableCell>

                        {/* Vendor */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={row.vendor ?? ''}
                              onChange={(e) => updateRow(row.id, { vendor: e.target.value })}
                            />
                          ) : (
                            row.vendor || '-'
                          )}
                        </TableCell>

                        {/* Description */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={row.description ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, { description: e.target.value })
                              }
                            />
                          ) : (
                            row.description || '-'
                          )}
                        </TableCell>

                        {/* Payment */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={(row as any).paymentMethod ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, { paymentMethod: e.target.value as any })
                              }
                            />
                          ) : (
                            (row as any).paymentMethod || '-'
                          )}
                        </TableCell>

                        {/* Reference */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={(row as any).reference ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, { reference: e.target.value as any })
                              }
                            />
                          ) : (
                            (row as any).reference || '-'
                          )}
                        </TableCell>

                        {/* Invoice */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="h-8"
                              value={(row as any).invoiceNumber ?? ''}
                              onChange={(e) =>
                                updateRow(row.id, { invoiceNumber: e.target.value })
                              }
                            />
                          ) : (
                            (row as any).invoiceNumber || '-'
                          )}
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              className="h-8 text-right"
                              type="number"
                              value={row.amount ?? 0}
                              onChange={(e) =>
                                updateRow(row.id, { amount: numberOrZero(e.target.value) })
                              }
                            />
                          ) : (
                            <>
                              $
                              {numberOrZero(row.amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="outline" className="h-8 w-8 px-0">
                                ⋯
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isEditing ? (
                                <DropdownMenuItem onClick={() => setEditingRowId(null)}>
                                  Done Editing
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setEditingRowId(row.id)}>
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
                  })}
                </React.Fragment>
              ))
            ) : (
              visibleRows.map((row) => {
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
                            c ? Array.from(new Set([...prev, row.id])) : prev.filter((id) => id !== row.id),
                          );
                        }}
                        aria-label="Select row"
                      />
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          className="h-8"
                          type="date"
                          value={displayExpenseDate(row.date) ?? ''}
                          onChange={(e) => updateRow(row.id, { date: e.target.value })}
                        />
                      ) : (
                        displayExpenseDate(row.date)
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          className="h-8"
                          value={row.category ?? ''}
                          onChange={(e) => updateRow(row.id, { category: e.target.value })}
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
                          onChange={(e) => updateRow(row.id, { vendor: e.target.value })}
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
                            updateRow(row.id, { description: e.target.value })
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
                            updateRow(row.id, { paymentMethod: e.target.value as any })
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
                            updateRow(row.id, { reference: e.target.value as any })
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
                            updateRow(row.id, { invoiceNumber: e.target.value })
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
                            updateRow(row.id, { amount: numberOrZero(e.target.value) })
                          }
                        />
                      ) : (
                        <>
                          $
                          {numberOrZero(row.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="outline" className="h-8 w-8 px-0">
                            ⋯
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isEditing ? (
                            <DropdownMenuItem onClick={() => setEditingRowId(null)}>
                              Done Editing
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setEditingRowId(row.id)}>
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
