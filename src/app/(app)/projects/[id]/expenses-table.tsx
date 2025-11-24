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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Expense } from './expenses-data';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';


import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  initialData?: Expense[] | null;
  onDataChange?: (rows: Expense[]) => void;
};

type AnyExpense = Expense & { id?: string };

type NewExpenseForm = {
  date: string; // YYYY-MM-DD from <input type="date">
  vendor: string;
  category: string;
  description: string;
  paymentMethod: string;
  reference: string;
  invoiceNumber: string;
  amount: string; // keep as string in the form, convert on save
};

function generateId(prefix = 'exp') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${(crypto as any).randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random()}`;
}
 

export function ExpensesTable({ initialData, onDataChange }: Props) {
  const [rows, setRows] = React.useState<AnyExpense[]>([]);
  const [groupByCategory, setGroupByCategory] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
  const [vendorFilter, setVendorFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // --- Edit dialog state ---
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingRowIndex, setEditingRowIndex] = React.useState<number | null>(
    null,
  );
  const [editingDraft, setEditingDraft] = React.useState<AnyExpense | null>(
    null,
  );


  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [newExpense, setNewExpense] = React.useState<NewExpenseForm>({
    date: '',
    vendor: '',
    category: '',
    description: '',
    paymentMethod: '',
    reference: '',
    invoiceNumber: '',
    amount: '0',
  });

  

  // ---------- Sync from parent (per-project expenses) ----------

  React.useEffect(() => {
    const safeData = (initialData ?? []) as AnyExpense[];

    // make sure every row has a stable id for selection
    const withIds = safeData.map((row, index) =>
      row.id ? row : { ...row, id: generateId(`row-${index}`) },
    );

    setRows(withIds);
    setSelectedIds([]);
  }, [initialData]);

  // push changes back to parent
  const updateRows = React.useCallback(
    (next: AnyExpense[]) => {
      setRows(next);
      onDataChange?.(next as Expense[]);
    },
    [onDataChange],
  );

  // ---------- Derived data (filters, options, totals) ----------

  const vendorOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((r) => (r.vendor ?? '').toString().trim())
            .filter((v) => v.length > 0),
        ),
      ),
    [rows],
  );

  const categoryOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((r) => (r.category ?? '').toString().trim())
            .filter((c) => c.length > 0),
        ),
      ),
    [rows],
  );

  const filteredRows = React.useMemo(
    () =>
      rows.filter((r) => {
        const vMatch =
          vendorFilter === 'all' || (r.vendor ?? '') === vendorFilter;
        const cMatch =
          categoryFilter === 'all' || (r.category ?? '') === categoryFilter;
        return vMatch && cMatch;
      }),
    [rows, vendorFilter, categoryFilter],
  );

  const totalAll = filteredRows.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0,
  );

  const groupedByCategory = React.useMemo(() => {
    const map = new Map<string, AnyExpense[]>();
    filteredRows.forEach((r) => {
      const key = (r.category || 'Uncategorized').toString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [filteredRows]);

  // ---------- Selection ----------

  const visibleIds = React.useMemo(
    () => filteredRows.map((r) => (r.id as string) ?? ''),
    [filteredRows],
  );

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    }
  };

  const toggleRowSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  // ---------- Delete ----------

  const handleDelete = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    updateRows(next);
  };

  // ---------- Import (.xlsx) ----------

  const handleClickImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);

      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        alert('This workbook has no sheets.');
        return;
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // rows are objects using the first row as headers
      const json: any[] = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: false,
      });

      if (!json.length) {
        alert('Imported 0 expenses (no data rows were found).');
        return;
      }

      const imported: AnyExpense[] = json.map((row, index) => {
        const rawAmount =
          row.Amount ??
          row.amount ??
          row['AMOUNT'] ??
          row['Amount '] ??
          row['Amount'] ??
          '';
        const amount = parseFloat(String(rawAmount).replace(/[^0-9.-]/g, ''));

        // Keep date exactly as spreadsheet shows (e.g. 8/12/2025)
        const rawDate =
          row.Date ?? row.DATE ?? row.date ?? row['Transaction Date'] ?? '';

        return {
          ...( {} as Expense ),
          id: generateId(`imp-${index}`),
          date: rawDate,
          category: row.Category ?? row.CATEGORY ?? row.category ?? '',
          vendor: row.Vendor ?? row.VENDOR ?? row.vendor ?? '',
          description:
            row.Description ?? row.DESCRIPTION ?? row.description ?? '',
          paymentMethod:
            row['Payment Method'] ??
            row['Payment method'] ??
            row.paymentMethod ??
            '',
          reference: row.Reference ?? row.REFERENCE ?? row.reference ?? '',
          invoiceNumber:
            row['Invoice #'] ??
            row['Invoice Number'] ??
            row['Invoice'] ??
            row.invoiceNumber ??
            '',
          amount: isNaN(amount) ? 0 : amount,
        };
      });

      const next = [...rows, ...imported];
      updateRows(next);
      alert(`Imported ${imported.length} expenses.`);
    } catch (err) {
      console.error('Failed to import expenses:', err);
      alert('Could not import this file. Please make sure it is an .xlsx file.');
    } finally {
      setIsImporting(false);
    }
  };

  // ---------- Add Expense dialog ----------

  const handleSaveNewExpense = () => {
    // Convert YYYY-MM-DD to MM/DD/YYYY so it matches your other imported rows
    const formattedDate =
      newExpense.date && !isNaN(Date.parse(newExpense.date))
        ? new Date(newExpense.date).toLocaleDateString('en-US')
        : '';

    const numericAmount = parseFloat(
      newExpense.amount.replace(/[^0-9.-]/g, ''),
    );

    const row: AnyExpense = {
      ...( {} as Expense ),
      id: generateId('manual'),
      date: formattedDate,
      vendor: newExpense.vendor.trim(),
      category: newExpense.category.trim(),
      description: newExpense.description.trim(),
      paymentMethod: newExpense.paymentMethod.trim(),
      reference: newExpense.reference.trim(),
      invoiceNumber: newExpense.invoiceNumber.trim(),
      amount: isNaN(numericAmount) ? 0 : numericAmount,
    };

    const next = [...rows, row];
    updateRows(next);

    // reset
    setNewExpense({
      date: '',
      vendor: '',
      category: '',
      description: '',
      paymentMethod: '',
      reference: '',
      invoiceNumber: '',
      amount: '0',
    });
    setIsAddOpen(false);
  };

  // ---------- Editing helpers ----------
const handleFieldChange = (
  idx: number,
  field:
    | 'date'
    | 'category'
    | 'vendor'
    | 'description'
    | 'paymentMethod'
    | 'reference'
    | 'invoiceNumber'
    | 'amount',
  value: string,
) => {
  const next = rows.map((row, i) => {
    if (i !== idx) return row;

    if (field === 'amount') {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return { ...row, amount: isNaN(num) ? 0 : num } as AnyExpense;
    }

    return { ...row, [field]: value } as AnyExpense;
  });

  // use whatever function you already have to update rows + parent
  updateRows(next);
};

  type EditableField =
    | 'date'
    | 'category'
    | 'vendor'
    | 'description'
    | 'paymentMethod'
    | 'reference'
    | 'invoiceNumber'
    | 'amount';

  const openEditDialog = (row: AnyExpense, idx: number) => {
    setEditingRowIndex(idx);
    setEditingDraft({ ...row });
    setIsEditOpen(true);
  };

  const handleEditDraftChange = (field: EditableField, value: string) => {
    if (!editingDraft) return;

    if (field === 'amount') {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      setEditingDraft({
        ...editingDraft,
        amount: isNaN(num) ? 0 : num,
      });
      return;
    }

    setEditingDraft({
      ...editingDraft,
      [field]: value,
    } as AnyExpense);
  };

  const handleSaveEdit = () => {
    if (editingRowIndex == null || !editingDraft) {
      setIsEditOpen(false);
      return;
    }

    const next = rows.map((r, i) => (i === editingRowIndex ? editingDraft : r));
    updateRows(next);

    setIsEditOpen(false);
    setEditingRowIndex(null);
    setEditingDraft(null);
  };


    // ---------- Render helpers ----------
    
    const filteredExpenses = React.useMemo(() => {
    return expenses.filter((exp) => {
      if (!exp) return false;

      // Vendor filter
      if (vendorFilter !== 'all' && exp.vendor !== vendorFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) {
        return false;
      }

      // Global text search across description / reference / invoice #
      if (searchTerm.trim()) {
        const needle = searchTerm.trim().toLowerCase();
        const haystack = [
          exp.description ?? '',
          exp.reference ?? '',
          exp.invoiceNumber ?? '',
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [expenses, vendorFilter, categoryFilter, searchTerm]);


  const renderRow = (row: AnyExpense, idx: number, indent = false) => {
    const rowId = (row.id as string) ?? generateId(`row-${idx}`);

    return (
      <TableRow key={rowId}>
        {/* selection checkbox */}
        <TableCell className="w-[40px]">
          <input
            type="checkbox"
            className="h-3 w-3 accent-primary"
            checked={selectedIds.includes(rowId)}
            onChange={(e) => toggleRowSelected(rowId, e.target.checked)}
          />
        </TableCell>

        <TableCell className={cn(indent && 'pl-8')}>
          {row.date ?? ''}
        </TableCell>
        <TableCell>{row.category ?? ''}</TableCell>
        <TableCell>{row.vendor ?? ''}</TableCell>
        <TableCell>{row.description ?? ''}</TableCell>
        <TableCell>{row.paymentMethod ?? ''}</TableCell>
        <TableCell>{row.reference ?? ''}</TableCell>
        <TableCell>{row.invoiceNumber ?? ''}</TableCell>
        <TableCell className="text-right">
          {(Number(row.amount) || 0).toFixed(2)}
        </TableCell>
        <TableCell className="text-right space-x-2">
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={() => openEditDialog(row, idx)}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-xs text-red-600 hover:underline"
            onClick={() => handleDelete(idx)}
          >
            Delete
          </button>
        </TableCell>
      </TableRow>
    );
  };


  // ---------- JSX ----------

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* left: group toggle + total */}
        <div className="flex items-center gap-2">
  {/* Global search */}
  <input
    className="h-9 w-64 rounded border px-2 text-sm"
    placeholder="Search description, reference, invoice..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  {/* Vendor filter */}
  <Select value={vendorFilter} onValueChange={setVendorFilter}>
    <SelectTrigger className="w-[140px]">
      <SelectValue placeholder="All Vendors" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Vendors</SelectItem>
      {Array.from(new Set(expenses.map((e) => e.vendor).filter(Boolean))).map(
        (vendor) => (
          <SelectItem key={vendor as string} value={vendor as string}>
            {vendor}
          </SelectItem>
        )
      )}
    </SelectContent>
  </Select>

  {/* Category filter */}
  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
    <SelectTrigger className="w-[140px]">
      <SelectValue placeholder="All Categories" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Categories</SelectItem>
      {Array.from(
        new Set(expenses.map((e) => e.category).filter(Boolean))
      ).map((cat) => (
        <SelectItem key={cat as string} value={cat as string}>
          {cat}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  className="h-3 w-3 accent-primary"
                  checked={allVisibleSelected}
                  onChange={(e) =>
                    toggleSelectAllVisible(e.target.checked)
                  }
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-sm py-6">
                  No expenses found for this project.
                </TableCell>
              </TableRow>
            )}

            {/* Normal flat view */}
            {!groupByCategory &&
              filteredRows.map((row) => {
                const idx = rows.indexOf(row);
                return renderRow(row, idx);
              })}

            {/* Grouped view */}
            {groupByCategory &&
              Array.from(groupedByCategory.entries()).map(
                ([category, catRows]) => {
                  const catTotal = catRows.reduce(
                    (sum, r) => sum + (Number(r.amount) || 0),
                    0,
                  );

                  return (
                    <React.Fragment key={category}>
                      <TableRow className="bg-muted/40">
                        <TableCell colSpan={10} className="text-sm font-medium">
                          {category}: ${catTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      {catRows.map((row) => {
                        const idx = rows.indexOf(row);
                        return renderRow(row, idx, true);
                      })}
                    </React.Fragment>
                  );
                },
              )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Expense dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details for this expense.
            </DialogDescription>
          </DialogHeader>

          {editingDraft && (
            <div className="space-y-4 py-2">
              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <input
                  type="date"
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={editingDraft.date ?? ''}
                  onChange={(e) =>
                    handleEditDraftChange('date', e.target.value)
                  }
                />
              </div>

              {/* Vendor */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Vendor (Optional)</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={editingDraft.vendor ?? ''}
                  onChange={(e) =>
                    handleEditDraftChange('vendor', e.target.value)
                  }
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={editingDraft.category ?? ''}
                  onChange={(e) =>
                    handleEditDraftChange('category', e.target.value)
                  }
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <textarea
                  className="w-full rounded border px-2 py-1 text-sm"
                  rows={3}
                  value={editingDraft.description ?? ''}
                  onChange={(e) =>
                    handleEditDraftChange('description', e.target.value)
                  }
                />
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Amount</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={
                    typeof editingDraft.amount === 'number'
                      ? editingDraft.amount.toString()
                      : (editingDraft.amount as any) ?? ''
                  }
                  onChange={(e) =>
                    handleEditDraftChange('amount', e.target.value)
                  }
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Payment Method</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={editingDraft.paymentMethod ?? ''}
                  onChange={(e) =>
                    handleEditDraftChange('paymentMethod', e.target.value)
                  }
                />
              </div>

              {/* Invoice # */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Invoice # (Optional)</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={editingDraft.invoiceNumber ?? ''}
                  onChange={(e) =>
                    handleEditDraftChange('invoiceNumber', e.target.value)
                  }
                />
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Reference</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={editingDraft.reference ?? ''}
                  onChange={(e) =>
                    handleEditDraftChange('reference', e.target.value)
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit}>
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}