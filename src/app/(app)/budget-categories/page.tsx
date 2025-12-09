"use client";

import * as React from "react";

type BudgetCategory = {
  id: number;
  category: string;
  costType: string;
};

const STORAGE_KEY = "budgetCategories";

const defaultCategories: Omit<BudgetCategory, "id">[] = [
  { category: "Sitework Labor", costType: "Sitework" },
  { category: "Sitework Material", costType: "Sitework" },
  { category: "Dirtwork Labor", costType: "Dirtwork" },
  { category: "Pollution Control Labor", costType: "Pollution" },
  { category: "Pollution Control Material", costType: "Pollution" },
  { category: "SWPP", costType: "SWPP" },
  { category: "Steel Labor", costType: "Steel" },
  { category: "Steel Material", costType: "Steel" },
  { category: "Haul Off", costType: "Haul" },
  { category: "Foundation Labor", costType: "Foundation" },
  { category: "Foundation Material", costType: "Foundation" },
  { category: "Parking Lot Labor", costType: "Parking" },
  { category: "Parking Lot Material", costType: "Parking" },
  { category: "SideWalk Labor", costType: "SideWalk" },
  { category: "SideWalk Material", costType: "SideWalk" },
  { category: "Curbs Labor", costType: "Curbs" },
  { category: "Curbs Material", costType: "Curbs" },
  { category: "Bollards/Car-stoppers", costType: "Bollards" },
  { category: "Electrical", costType: "Electrical" },
  { category: "Plumbing", costType: "Plumbing" },
  { category: "HVAC", costType: "HVAC" },
  { category: "Framing Labor", costType: "Framing" },
  { category: "Framing Material", costType: "Framing" },
  { category: "Doors/Hardware Labor", costType: "Doors" },
  { category: "Doors/Hardware Material", costType: "Doors" },
  {
    category: "Roof/Coping/Downspots/CollectorBox",
    costType: "Roof",
  },
  { category: "Store front Canopy Labor", costType: "Store" },
  { category: "Store front Canopy Material", costType: "Store" },
  { category: "Stucco/Bricks/Burnished Blocks", costType: "Stucco" },
  { category: "Store front GLASS", costType: "Store" },
  { category: "Floor / Tiles Labor", costType: "Floor" },
  { category: "Floor / Tiles Material", costType: "Floor" },
  { category: "Paint Labor", costType: "Paint" },
  { category: "Paint Material", costType: "Paint" },
  { category: "Millwork", costType: "Millwork" },
  { category: "VentHood", costType: "VentHood" },
  { category: "Ansul System", costType: "Ansul" },
  { category: "RENTALS", costType: "RENTALS" },
  { category: "Landscape Labor", costType: "Landscape" },
  { category: "Landscape Material", costType: "Landscape" },
  { category: "Survey", costType: "Survey" },
  { category: "Cleanup", costType: "Cleanup" },
  { category: "Stripes Labor", costType: "Stripes" },
  { category: "Stripes Material", costType: "Stripes" },
  { category: "Misc.", costType: "Misc" },
  { category: "Builder's Risk", costType: "Builder's" },
  {
    category: "Administrative/Superintendent Cost",
    costType: "Administrative",
  },
];

export default function BudgetCategoriesPage() {
  const [categories, setCategories] = React.useState<BudgetCategory[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Add form state
  const [newCategory, setNewCategory] = React.useState("");
  const [newCostType, setNewCostType] = React.useState("");

  // Edit state
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editCategory, setEditCategory] = React.useState("");
  const [editCostType, setEditCostType] = React.useState("");

  // ---------- INITIAL LOAD (localStorage + default) ----------
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BudgetCategory[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          setIsLoaded(true);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to read budget categories from localStorage:", err);
    }

    // Fallback to defaults with IDs
    const withIds: BudgetCategory[] = defaultCategories.map((item, index) => ({
      id: index + 1,
      ...item,
    }));
    setCategories(withIds);
    setIsLoaded(true);
  }, []);

  // ---------- SAVE TO LOCALSTORAGE ----------
  React.useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (err) {
      console.error("Failed to save budget categories:", err);
    }
  }, [categories, isLoaded]);

  // ---------- HELPERS ----------
  const nextId = React.useCallback(
    () => (categories.length ? Math.max(...categories.map((c) => c.id)) + 1 : 1),
    [categories]
  );

  // ---------- ADD ----------
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newCategory.trim();
    const cost = newCostType.trim();
    if (!cat || !cost) {
      alert("Please enter both Category and Cost Type.");
      return;
    }

    setCategories((prev) => [
      ...prev,
      { id: nextId(), category: cat, costType: cost },
    ]);

    setNewCategory("");
    setNewCostType("");
  };

  // ---------- EDIT ----------
  const startEdit = (row: BudgetCategory) => {
    setEditingId(row.id);
    setEditCategory(row.category);
    setEditCostType(row.costType);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCategory("");
    setEditCostType("");
  };

  const saveEdit = (id: number) => {
    const cat = editCategory.trim();
    const cost = editCostType.trim();
    if (!cat || !cost) {
      alert("Please enter both Category and Cost Type.");
      return;
    }

    setCategories((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, category: cat, costType: cost } : row
      )
    );
    cancelEdit();
  };

  // ---------- DELETE ----------
  const deleteCategory = (id: number) => {
    const ok = window.confirm("Delete this budget category?");
    if (!ok) return;

    setCategories((prev) => prev.filter((row) => row.id !== id));
  };

    // ---------- IMPORT DEFAULT CATEGORIES ----------
  const handleImportDefaults = () => {
    setCategories((prev) => {
      // Build a set of existing category + costType combos (case-insensitive)
      const existingKeys = new Set(
        prev.map((c) =>
          `${c.category.trim().toLowerCase()}|${c.costType
            .trim()
            .toLowerCase()}`
        )
      );

      // Find current max id so we can keep ids unique
      let currentMaxId = prev.length
        ? Math.max(...prev.map((c) => c.id))
        : 0;

      const toAdd: BudgetCategory[] = [];

      for (const item of defaultCategories) {
        const key = `${item.category.trim().toLowerCase()}|${item.costType
          .trim()
          .toLowerCase()}`;
        if (!existingKeys.has(key)) {
          currentMaxId += 1;
          toAdd.push({
            id: currentMaxId,
            category: item.category,
            costType: item.costType,
          });
        }
      }

      if (toAdd.length === 0) {
        alert("All default budget categories are already imported.");
        return prev;
      }

      alert(`Imported ${toAdd.length} default budget categor${toAdd.length === 1 ? "y" : "ies"}.`);
      return [...prev, ...toAdd];
    });
  };


  // ---------- JSX ----------
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-semibold">
            Budget Categories
          </h1>
          <p className="text-sm text-slate-500">
            Standard categories and cost types used across your projects.
          </p>
        </div>
      </div>

      {/* Add form */}
      <form
        onSubmit={handleAddCategory}
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-white px-3 py-3"
      >
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Category
          </label>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            placeholder="e.g. New Category"
          />
        </div>

        <div className="w-full sm:w-52">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Cost Type
          </label>
          <input
            type="text"
            value={newCostType}
            onChange={(e) => setNewCostType(e.target.value)}
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            placeholder="e.g. Sitework"
          />
        </div>

          <button
    type="submit"
    className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
  >
    + Add Category
  </button>

  <button
    type="button"
    onClick={handleImportDefaults}
    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
  >
    Import Defaults
  </button>
</form>


      {/* Table */}
      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-medium text-slate-600 w-2/3">
                  Category
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Cost Type
                </th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((row) => {
                const isEditing = row.id === editingId;
                return (
                  <tr key={row.id} className="border-t align-top">
                    {/* Category */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full rounded-md border px-2 py-1 text-sm"
                        />
                      ) : (
                        row.category
                      )}
                    </td>

                    {/* Cost Type */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editCostType}
                          onChange={(e) => setEditCostType(e.target.value)}
                          className="w-full rounded-md border px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="text-slate-600">{row.costType}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(row.id)}
                            className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-md border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="rounded-md border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCategory(row.id)}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}

              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-4 text-sm text-slate-500 text-center"
                  >
                    No budget categories defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
