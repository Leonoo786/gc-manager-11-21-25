"use client";

import * as React from "react";

type ExpensesTableProps = {
  projectId?: string;
};

type Expense = {
  id: string;
  name: string;
  category: string;
  amount: number;
};

export function ExpensesTable({ projectId }: ExpensesTableProps) {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);

  // Later we can load real data (Supabase, etc)
  React.useEffect(() => {
    // TEMP: example data so the table isn't empty
    setExpenses([
      { id: "1", name: "Concrete", category: "Materials", amount: 1200 },
      { id: "2", name: "Labor - framing", category: "Labor", amount: 3500 },
    ]);
  }, [projectId]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base md:text-lg font-semibold">Expenses</h2>
          {projectId && (
            <p className="text-xs text-slate-500">
              Project ID: <span className="font-mono">{projectId}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total
          </p>
          <p className="text-sm md:text-base font-semibold">
            ${total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Item
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Category
                </th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-4 text-sm text-slate-500"
                    colSpan={3}
                  >
                    No expenses yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="border-t">
                    <td className="px-3 py-2">{exp.name}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {exp.category}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      ${exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
