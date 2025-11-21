

'use client';
import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { type Expense } from './expenses-data';
import { type BudgetItem } from './budget-data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpDown } from 'lucide-react';

interface SpendingData {
  category: string;
  budget: number;
  spent: number;
  color: string;
}

const categoryColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];


export function SpendingCategoriesTable({ expenses, budgetItems }: { expenses: Expense[], budgetItems: BudgetItem[] }) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof SpendingData | 'category'; direction: 'ascending' | 'descending' } | null>({ key: 'spent', direction: 'descending' });

  const spendingData = useMemo(() => {
    const categoryMap: { [key: string]: { budget: number, spent: number, expenses: Expense[] } } = {};

    budgetItems.forEach(item => {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = { budget: 0, spent: 0, expenses: [] };
      }
      categoryMap[item.category].budget += item.originalBudget;
    });

    expenses.forEach(expense => {
      if (!categoryMap[expense.category]) {
        categoryMap[expense.category] = { budget: 0, spent: 0, expenses: [] };
      }
      categoryMap[expense.category].spent += expense.amount;
      categoryMap[expense.category].expenses.push(expense);
    });

    let data = Object.entries(categoryMap)
      .map(([category, { budget, spent, expenses }], index) => ({
        category,
        budget,
        spent,
        color: categoryColors[index % categoryColors.length],
        expenses: expenses,
        transactionCount: expenses.length,
      }));

    if (sortConfig !== null) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
      
  }, [expenses, budgetItems, sortConfig]);

  const requestSort = (key: keyof SpendingData | 'category') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getProgressColorClass = (progress: number) => {
    if (progress > 100) return '[&>*]:bg-destructive';
    if (progress > 75) return '[&>*]:bg-yellow-500';
    return '[&>*]:bg-blue-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Spending Categories</CardTitle>
        <CardDescription>A summary of spending by budget category for this project.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => requestSort('category')}>
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => requestSort('budget')}>
                    Budget
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => requestSort('spent')}>
                    Spent
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="w-[150px]">Progress Chart</TableHead>
              <TableHead className="text-center">Transactions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spendingData.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No spending data available.
                    </TableCell>
                </TableRow>
            ) : (
                spendingData.map((item) => {
                const balance = item.budget - item.spent;
                const progress = item.budget > 0 ? (item.spent / item.budget) * 100 : (item.spent > 0 ? 100 : 0);
                
                return (
                    <TableRow key={item.category}>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.category}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">${item.budget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    <TableCell className={`text-right ${item.spent > item.budget ? 'text-destructive' : ''}`}>${item.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    <TableCell className={`text-right ${balance < 0 ? 'text-destructive' : ''}`}>
                        {balance < 0 ? `-$${Math.abs(balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `$${balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Progress value={progress} className={`h-2 ${getProgressColorClass(progress)}`} />
                            <span className="text-xs text-muted-foreground">{progress.toFixed(1)}%</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" disabled={item.transactionCount === 0}>
                                    {item.transactionCount} {item.transactionCount === 1 ? 'Item' : 'Items'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[800px]">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Expenses for {item.category}</h4>
                                    <div className="max-h-80 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead>Vendor</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Payment Method</TableHead>
                                                    <TableHead>Reference</TableHead>
                                                    <TableHead>Invoice #</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {item.expenses.map(expense => (
                                                    <TableRow key={expense.id}>
                                                        <TableCell className="text-xs">{expense.category}</TableCell>
                                                        <TableCell className="text-xs">{expense.vendor}</TableCell>
                                                        <TableCell className="text-xs truncate max-w-[150px]">{expense.description}</TableCell>
                                                        <TableCell className="text-xs">{expense.paymentMethod}</TableCell>
                                                        <TableCell className="text-xs">{expense.reference}</TableCell>
                                                        <TableCell className="text-xs">{expense.invoiceNumber}</TableCell>
                                                        <TableCell className="text-right text-xs">${expense.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </TableCell>
                    </TableRow>
                );
                })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
