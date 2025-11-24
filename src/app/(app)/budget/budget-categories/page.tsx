"use client";

import React from "react";

export default function BudgetCategoriesPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1 className="text-2xl font-bold mb-4">
        Budget Categories – SIMPLE (nested)
      </h1>
      <p>
        If you see this text on <code>/budget/budget-categories</code>, this
        page is now using the simple version with{" "}
        <strong>no localeCompare</strong>.
      </p>
    </div>
  );
}
