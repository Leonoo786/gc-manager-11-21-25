// src/app/(app)/projects/[id]/expenses-data.ts

// This is the single source of truth for the Expense type.
// It now matches the columns in your Excel file exactly.

export type Expense = {
  id: string;
  date: string;           // e.g. "1/10/2025"
  category: string;       // e.g. "Cleaning", "Get Reimbursed"
  vendor: string;         // e.g. "City Of League City"
  description: string;
  paymentMethod?: string; // e.g. "Check", "CC", "Bank ACH", "to be paid"
  reference?: string;     // check number or other reference
  invoice?: string;       // this corresponds to "Invoice #"
  amount: number;         // numeric dollar amount
};

// You can keep sample data here if you want.
// For now we just export an empty array so anything importing `expenses` still works.
export const expenses: Expense[] = [];
