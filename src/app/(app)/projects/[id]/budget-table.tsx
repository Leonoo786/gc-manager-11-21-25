'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Upload } from 'lucide-react';
import type { BudgetItem } from './budget-data';

type BudgetTableProps = {
  initialData?: BudgetItem[];
  onDataChange?: (items: BudgetItem[]) => void;
  onCommittedTotalChange?: (total: number) => void;
};

type EditableBudgetItem = BudgetItem & { id: string };

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '$0.00';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

export function BudgetTable({
  initialData,
  onDataChange,
  onCommittedTotalChange,
}: BudgetTableProps) {
  const [items, setItems] = useState<EditableBudgetItem[]>([]);
  const [isGrouped, setIsGrouped] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditableBudgetItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -------- Seed local state from initialData ONCE per mount --------
  useEffect(() => {
    if (!initialData || initialData.length === 0) return;

    setItems((prev) => {
      if (prev.length > 0) return prev; // don't overwrite imported/edited items
      const withIds: EditableBudgetItem[] = initialData.map((item, index) => ({
        id: item.id ?? `budget-${index}-${Date.now()}`,
        ...item,
      }));
      return withIds;
    });
  }, [initialData]);

  // -------- Bubble changes up to parent whenever items change --------
  useEffect(() => {
    if (onDataChange) {
      onDataChange(items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    if (onCommittedTotalChange) {
      const committed = items.reduce(
        (sum, i) => sum + (i.committedCost ?? 0),
        0,
      );
      onCommittedTotalChange(committed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // -------- Category filter options --------
  const allCategories = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((i) => i.category?.trim())
            .filter((c): c is string => !!c),
        ),
      ).sort(),
    [items],
  );

  const filteredItems = useMemo(() => {
    if (!selectedCategories.length) return items;
    const set = new Set(selectedCategories);
    return items.filter((i) => i.category && set.has(i.category));
  }, [items, selectedCategories]);

  // -------- Grouping (by Cost Type, e.g. "Sitework") --------
  const groupedCategories = useMemo(() => {
    if (!isGrouped) return [];

    const map = new Map<
      string,
      { totalFinalBidToCustomer: number; items: EditableBudgetItem[] }
    >();

    for (const item of filteredItems) {
      const key = item.costType || 'Uncategorized';
      if (!map.has(key)) {
        map.set(key, { totalFinalBidToCustomer: 0, items: [] });
      }
      const entry = map.get(key)!;
      entry.totalFinalBidToCustomer += item.finalBidToCustomer ?? 0;
      entry.items.push(item);
    }

    return Array.from(map.entries()).map(([groupName, data]) => ({
      groupName,
      totalFinalBidToCustomer: data.totalFinalBidToCustomer,
      items: data.items,
    }));
  }, [filteredItems, isGrouped]);

  // -------- Import (.xlsx / .csv) --------
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const parseNumber = (value: any): number | undefined => {
    if (value == null || value === '') return undefined;
    const cleaned =
      typeof value === 'string'
        ? value.replace(/[$,]/g, '').trim()
        : String(value);
    if (!cleaned) return undefined;
    const num = Number(cleaned);
    return Number.isNaN(num) ? undefined : num;
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
      });

      const imported: EditableBudgetItem[] = rows.map((row, index) => ({
        id: `import-${Date.now()}-${index}`,
        category: row['Category'] ?? '',
        costType: row['Cost Type'] ?? '',
        finalBidToCustomer: parseNumber(row['Final Bid to Customer']) ?? 0,
        originalBudget: parseNumber(row['Original Budget']) ?? 0,
        approvedCOs: parseNumber(row['Approved COs']) ?? 0,
        revisedBudget: parseNumber(row['Revised Budget']) ?? 0,
        committedCost: parseNumber(row['Committed Cost']) ?? 0,
        projectedCost: parseNumber(row['Projected Cost']) ?? 0,
      }));

      setItems(imported);
    } catch (err) {
      console.error('Failed to import budget file', err);
      alert('Could not import that file. Please make sure it is a valid Excel/CSV.');
    } finally {
      e.target.value = '';
    }
  };

  // -------- CRUD helpers --------
  const handleAddItem = () => {
    const newItem: EditableBudgetItem = {
      id: `new-${Date.now()}`,
      category: '',
      costType: '',
      finalBidToCustomer: 0,
      originalBudget: 0,
      approvedCOs: 0,
      revisedBudget: 0,
      committedCost: 0,
      projectedCost: 0,
    };
    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);
    setEditDraft(newItem);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditDraft(null);
    }
  };

  const startEdit = (item: EditableBudgetItem) => {
    setEditingId(item.id);
    setEditDraft({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = () => {
    if (!editingId || !editDraft) return;
    setItems((prev) => prev.map((i) => (i.id === editingId ? editDraft : i)));
    setEditingId(null);
    setEditDraft(null);
  };

  const updateDraftField = <K extends keyof EditableBudgetItem>(
    key: K,
    value: EditableBudgetItem[K],
  ) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, [key]: value });
  };

  // -------- Render --------
  const noItems =
    (!isGrouped && filteredItems.length === 0) ||
    (isGrouped && groupedCategories.length === 0);

  return (
    <div className="space-y-4">
      {/* Hidden file input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={isGrouped ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsGrouped((v) => !v)}
          >
            Group by Category
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {selectedCategories.length === 0
                  ? 'All Categories'
                  : `${selectedCategories.length} selected`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-auto">
              {allCategories.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat}
                  checked={selectedCategories.includes(cat)}
                  onCheckedChange={(checked) => {
                    setSelectedCategories((prev) =>
                      checked ? [...prev, cat] : prev.filter((c) => c !== cat),
                    );
                  }}
                >
                  {cat}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="mr-1 h-4 w-4" />
            Import
          </Button>
          <Button size="sm" onClick={handleAddItem}>
            <Plus className="mr-1 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="w-10 px-3 py-2" />
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Cost Type</th>
              <th className="px-3 py-2">Final Bid to Customer</th>
              <th className="px-3 py-2">Original Budget</th>
              <th className="px-3 py-2">Approved COs</th>
              <th className="px-3 py-2">Revised Budget</th>
              <th className="px-3 py-2">Committed Cost</th>
              <th className="px-3 py-2">Projected Cost</th>
              {!isGrouped && <th className="px-3 py-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {noItems && (
              <tr>
                <td
                  colSpan={isGrouped ? 9 : 10}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  No budget items yet.
                </td>
              </tr>
            )}

            {/* GROUPED VIEW */}
            {isGrouped &&
              groupedCategories.map((group) => (
                <React.Fragment key={group.groupName}>
                  {/* Group header row */}
                  <tr className="border-t bg-muted/40">
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 font-semibold">
                      {group.groupName}: total{' '}
                      {formatCurrency(group.totalFinalBidToCustomer)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">Cost Type</td>
                    <td className="px-3 py-2 font-semibold">
                      {formatCurrency(group.totalFinalBidToCustomer)}
                    </td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                  </tr>

                  {/* Child rows */}
                  {group.items.map((item) => {
                    const isEditing = editingId === item.id;

                    if (isEditing && editDraft) {
                      return (
                        <tr key={item.id} className="border-t bg-muted/20">
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2 pl-8">
                            <input
                              className="w-full rounded border px-2 py-1 text-xs"
                              value={editDraft.category ?? ''}
                              onChange={(e) =>
                                updateDraftField('category', e.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full rounded border px-2 py-1 text-xs"
                              value={editDraft.costType ?? ''}
                              onChange={(e) =>
                                updateDraftField('costType', e.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full rounded border px-2 py-1 text-xs"
                              value={editDraft.finalBidToCustomer ?? 0}
                              onChange={(e) =>
                                updateDraftField(
                                  'finalBidToCustomer',
                                  Number(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full rounded border px-2 py-1 text-xs"
                              value={editDraft.originalBudget ?? 0}
                              onChange={(e) =>
                                updateDraftField(
                                  'originalBudget',
                                  Number(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full rounded border px-2 py-1 text-xs"
                              value={editDraft.approvedCOs ?? 0}
                              onChange={(e) =>
                                updateDraftField(
                                  'approvedCOs',
                                  Number(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full rounded border px-2 py-1 text-xs"
                              value={editDraft.revisedBudget ?? 0}
                              onChange={(e) =>
                                updateDraftField(
                                  'revisedBudget',
                                  Number(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full rounded border px-2 py-1 text-xs"
                              value={editDraft.committedCost ?? 0}
                              onChange={(e) =>
                                updateDraftField(
                                  'committedCost',
                                  Number(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full rounded border px-2 py-1 text-xs"
                              value={editDraft.projectedCost ?? 0}
                              onChange={(e) =>
                                updateDraftField(
                                  'projectedCost',
                                  Number(e.target.value) || 0,
                                )
                              }
                            />
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2 pl-8">{item.category}</td>
                        <td className="px-3 py-2">{item.costType}</td>
                        <td className="px-3 py-2">
                          {formatCurrency(item.finalBidToCustomer)}
                        </td>
                        <td className="px-3 py-2">
                          {formatCurrency(item.originalBudget)}
                        </td>
                        <td className="px-3 py-2">
                          {formatCurrency(item.approvedCOs)}
                        </td>
                        <td className="px-3 py-2">
                          {formatCurrency(item.revisedBudget)}
                        </td>
                        <td className="px-3 py-2">
                          {formatCurrency(item.committedCost)}
                        </td>
                        <td className="px-3 py-2">
                          {formatCurrency(item.projectedCost)}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

            {/* UNGROUPED VIEW */}
            {!isGrouped &&
              filteredItems.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing && editDraft) {
                  return (
                    <tr key={item.id} className="border-t bg-muted/40">
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2">
                        <input
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editDraft.category ?? ''}
                          onChange={(e) =>
                            updateDraftField('category', e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editDraft.costType ?? ''}
                          onChange={(e) =>
                            updateDraftField('costType', e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editDraft.finalBidToCustomer ?? 0}
                          onChange={(e) =>
                            updateDraftField(
                              'finalBidToCustomer',
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editDraft.originalBudget ?? 0}
                          onChange={(e) =>
                            updateDraftField(
                              'originalBudget',
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editDraft.approvedCOs ?? 0}
                          onChange={(e) =>
                            updateDraftField(
                              'approvedCOs',
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editDraft.revisedBudget ?? 0}
                          onChange={(e) =>
                            updateDraftField(
                              'revisedBudget',
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editDraft.committedCost ?? 0}
                          onChange={(e) =>
                            updateDraftField(
                              'committedCost',
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editDraft.projectedCost ?? 0}
                          onChange={(e) =>
                            updateDraftField(
                              'projectedCost',
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button size="xs" onClick={saveEdit}>
                            Save
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2">{item.costType}</td>
                    <td className="px-3 py-2">
                      {formatCurrency(item.finalBidToCustomer)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(item.originalBudget)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(item.approvedCOs)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(item.revisedBudget)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(item.committedCost)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(item.projectedCost)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
