"use client";

import * as React from "react";

type BudgetCategory = {
  category: string;
  costType: string;
};

const initialCategories: BudgetCategory[] = [
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
  const [categories] = React.useState<BudgetCategory[]>(initialCategories);

  const handleAddCategoryClick = () => {
    // Placeholder for future feature
    alert("Add Budget Category form coming soon.");
  };

  return (
    <div className="space-y-4">
      {/* Header + button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-semibold">
            Budget Categories
          </h1>
          <p className="text-sm text-slate-500">
            Standard categories and cost types used across your projects.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddCategoryClick}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          + Add Category
        </button>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {categories.map((row, index) => (
                <tr key={index} className="border-t">
                  <td className="px-3 py-2">{row.category}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.costType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
