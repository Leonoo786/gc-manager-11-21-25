'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';


type BudgetCategory = {
  id: string;
  name: string;
  costType: string;
};

const STORAGE_KEY = 'budgetCategories';

// 🔹 FULL list from your spreadsheet
const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: 'bc-sitework-labor', name: 'Sitework Labor', costType: 'Sitework' },
  { id: 'bc-sitework-material', name: 'Sitework Material', costType: 'Sitework' },

  { id: 'bc-dirtwork-labor', name: 'Dirtwork Labor', costType: 'Dirtwork' },

  { id: 'bc-pollution-labor', name: 'Pollution Control Labor', costType: 'Pollution' },
  { id: 'bc-pollution-material', name: 'Pollution Control Material', costType: 'Pollution' },

  { id: 'bc-swpp', name: 'SWPP', costType: 'SWPP' },

  { id: 'bc-steel-labor', name: 'Steel Labor', costType: 'Steel' },
  { id: 'bc-steel-material', name: 'Steel Material', costType: 'Steel' },

  { id: 'bc-haul-off', name: 'Haul Off', costType: 'Haul' },

  { id: 'bc-foundation-labor', name: 'Foundation Labor', costType: 'Foundation' },
  { id: 'bc-foundation-material', name: 'Foundation Material', costType: 'Foundation' },

  { id: 'bc-parking-labor', name: 'Parking Lot Labor', costType: 'Parking' },
  { id: 'bc-parking-material', name: 'Parking Lot Material', costType: 'Parking' },

  { id: 'bc-sidewalk-labor', name: 'SideWalk Labor', costType: 'SideWalk' },
  { id: 'bc-sidewalk-material', name: 'SideWalk Material', costType: 'SideWalk' },

  { id: 'bc-curbs-labor', name: 'Curbs Labor', costType: 'Curbs' },
  { id: 'bc-curbs-material', name: 'Curbs Material', costType: 'Curbs' },

  { id: 'bc-bollards', name: 'Bollards/Car-stoppers', costType: 'Bollards' },

  { id: 'bc-electrical', name: 'Electrical', costType: 'Electrical' },
  { id: 'bc-plumbing', name: 'Plumbing', costType: 'Plumbing' },
  { id: 'bc-hvac', name: 'HVAC', costType: 'HVAC' },

  { id: 'bc-framing-labor', name: 'Framing Labor', costType: 'Framing' },
  { id: 'bc-framing-material', name: 'Framing Material', costType: 'Framing' },

  { id: 'bc-doors-labor', name: 'Doors/Hardware Labor', costType: 'Doors' },
  { id: 'bc-doors-material', name: 'Doors/Hardware Material', costType: 'Doors' },

  {
    id: 'bc-roof',
    name: 'Roof/Coping/Downspots/CollectorBox',
    costType: 'Roof',
  },

  { id: 'bc-store-canopy-labor', name: 'Store front Canopy Labor', costType: 'Store' },
  {
    id: 'bc-store-canopy-material',
    name: 'Store front Canopy Material',
    costType: 'Store',
  },

  { id: 'bc-stucco', name: 'Stucco/Bricks/Burnished Blocks', costType: 'Stucco' },

  { id: 'bc-store-glass', name: 'Store front GLASS', costType: 'Store' },

  { id: 'bc-floor-labor', name: 'Floor / Tiles Labor', costType: 'Floor' },
  { id: 'bc-floor-material', name: 'Floor / Tiles Material', costType: 'Floor' },

  { id: 'bc-paint-labor', name: 'Paint Labor', costType: 'Paint' },
  { id: 'bc-paint-material', name: 'Paint Material', costType: 'Paint' },

  { id: 'bc-millwork', name: 'Millwork', costType: 'Millwork' },

  { id: 'bc-venthood', name: 'VentHood', costType: 'VentHood' },
  { id: 'bc-ansul', name: 'Ansul System', costType: 'Ansul' },

  { id: 'bc-rentals', name: 'RENTALS', costType: 'RENTALS' },

  { id: 'bc-landscape-labor', name: 'Landscape Labor', costType: 'Landscape' },
  {
    id: 'bc-landscape-material',
    name: 'Landscape Material',
    costType: 'Landscape',
  },

  { id: 'bc-survey', name: 'Survey', costType: 'Survey' },

  { id: 'bc-cleanup', name: 'Cleanup', costType: 'Cleanup' },

  { id: 'bc-stripes-labor', name: 'Stripes Labor', costType: 'Stripes' },
  { id: 'bc-stripes-material', name: 'Stripes Material', costType: 'Stripes' },

  { id: 'bc-misc', name: 'Misc.', costType: 'Misc' },

  { id: 'bc-builders-risk', name: "Builder's Risk", costType: "Builder's" },

  {
    id: 'bc-admin-superintendent',
    name: 'Administrative/Superintendent Cost',
    costType: 'Administrative',
  },
];

// Safely normalize whatever is in localStorage
function normalizeCategories(raw: any): BudgetCategory[] {
  if (!Array.isArray(raw)) return DEFAULT_CATEGORIES;

  return raw
    .map((item, index) => {
      if (!item) return null;
      const name = (item.name ?? item.category ?? '').toString().trim();
      const costType = (item.costType ?? '').toString().trim();
      if (!name && !costType) return null;

      return {
        id:
          (item.id as string) ||
          `bc-${index}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        costType,
      };
    })
    .filter((v): v is BudgetCategory => v !== null);
}

export default function BudgetCategoriesPage() {
  const [categories, setCategories] = React.useState<BudgetCategory[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_CATEGORIES;
      const parsed = JSON.parse(saved);
      return normalizeCategories(parsed);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [newName, setNewName] = React.useState('');
  const [newCostType, setNewCostType] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editCostType, setEditCostType] = React.useState('');

  // Save to localStorage whenever categories change
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (err) {
      console.error('Failed to save budget categories:', err);
    }
  }, [categories]);

  const handleAdd = () => {
  const name = newName.trim();
  const costType = newCostType.trim();

  // Don’t add completely empty rows
  if (!name && !costType) return;

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `bc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Add new category at the end
  setCategories((prev) => [...prev, { id, name, costType }]);

  // Clear inputs
  setNewName('');
  setNewCostType('');
};


  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const startEdit = (cat: BudgetCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditCostType(cat.costType);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCostType('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    const costType = editCostType.trim();
    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingId ? { ...c, name, costType } : c,
      ),
    );
    cancelEdit();
  };

  // Merge defaults with existing (no duplicates)
  const handleImportDefaults = () => {
    setCategories((prev) => {
      const existing = new Set(
        prev.map((c) => `${c.name}__${c.costType}`.toLowerCase()),
      );
      return [
        ...prev,
        ...DEFAULT_CATEGORIES.filter(
          (c) =>
            !existing.has(
              `${c.name}__${c.costType}`.toLowerCase(),
            ),
        ),
      ];
    });
  };

  // Replace everything with your master list
  const handleReplaceWithMasterList = () => {
    setCategories(DEFAULT_CATEGORIES);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Budget Categories</h1>
        <p className="text-sm text-slate-500">
          Standard categories and cost types used across your projects.
        </p>
      </div>

      {/* Add Category row */}
      <div className="rounded-md border bg-white px-4 py-3">
        <div className="grid gap-3 md:grid-cols-[2fr,2fr,auto] items-center">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Category
            </label>
            <Input
              placeholder="e.g. Sitework Labor"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Cost Type
            </label>
            <Input
              placeholder="e.g. Sitework"
              value={newCostType}
              onChange={(e) => setNewCostType(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 mt-4 md:mt-6 justify-end">
  <Button
    type="button"
    variant="outline"
    onClick={handleImportDefaults}
  >
    Merge Defaults
  </Button>

  <Button
    type="button"
    variant="outline"
    onClick={handleReplaceWithMasterList}
  >
    Import Category / Cost Type List
  </Button>

  <Button
    type="button"
    onClick={handleAdd}   // ⬅️ make sure there is NO () here
  >
    + Add Category
  </Button>
</div>

        </div>
    </div>

      {/* Categories table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Cost Type</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-6 text-sm text-slate-500"
                >
                  No budget categories yet. Add a new one above or import
                  defaults.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  {editingId === cat.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editCostType}
                          onChange={(e) =>
                            setEditCostType(e.target.value)
                          }
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveEdit}>
                          Save
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell>{cat.costType}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-2"
                            >
                              ⋯
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => startEdit(cat)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(cat.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
