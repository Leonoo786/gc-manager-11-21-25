'use client';

export default function BudgetCategoriesRootPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Budget Categories – ROOT</h1>
      <p>
        This is the simple root route at <code>/budget-categories</code>. It has
        <strong> no localeCompare / useMemo / sortedAndFiltered</strong>.
      </p>
      <p>
        If you&apos;re seeing this page and still get a localeCompare error, it
        means the error is coming from some other file.
      </p>
    </div>
  );
}
