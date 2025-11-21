'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Search, MoreHorizontal, Plus } from 'lucide-react';

import {
  budgetCategoriesData,
  type BudgetCategory,
} from './budget-categories-data';

const STORAGE_KEY = 'budgetCategories';

function getInitialCategories(): BudgetCategory[] {
  if (typeof window === 'undefined') {
    return [...budgetCategoriesData];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(budgetCategoriesData)
      );
      return [...budgetCategoriesData];
    }
    const parsed = JSON.parse(stored) as BudgetCategory[];
    return parsed.length ? parsed : [...budgetCategoriesData];
  } catch {
    return [...budgetCategoriesData];
  }
}

export default function BudgetCategoriesPage() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [search, setSearch] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<BudgetCategory | null>(null);

  useEffect(() => {
    const initial = getInitialCategories();
    setCategories(initial);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (err) {
      console.error('Failed to save budget categories', err);
    }
  }, [categories, isMounted]);

  const sortedAndFiltered = React.useMemo(() => {
  const search = searchTerm.trim().toLowerCase();

  // categories might be undefined, so fall back to []
  const base = Array.isArray(categories) ? categories : [];

  return base
    .filter((cat) => {
      const name = (cat?.name ?? '').toString().toLowerCase();
      return search === '' ? true : name.includes(search);
    })
    .sort((aRaw, bRaw) => {
      const a = aRaw ?? { name: '' };
      const b = bRaw ?? { name: '' };

      const nameA = (a.name ?? '').toString().toLowerCase();
      const nameB = (b.name ?? '').toString().toLowerCase();

      return nameA.localeCompare(nameB);
    });
}, [categories, searchTerm]);



  const handleCreate = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: BudgetCategory) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = (data: Omit<BudgetCategory, 'id'> & { id?: string }) => {
    if (data.id) {
      setCategories((prev) =>
        prev.map((c) => (c.id === data.id ? { ...c, ...data, id: data.id! } : c))
      );
    } else {
      const newCategory: BudgetCategory = {
        id:
          (typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : Date.now().toString()) + '-' + Math.random().toString(36).slice(2),
        category: data.category,
        costType: data.costType,
        notes: data.notes,
      };
      setCategories((prev) => [...prev, newCategory]);
    }

    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  if (!isMounted) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading budget categories…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Budget Categories
          </h1>
          <p className="text-muted-foreground">
            Define standard cost categories used across your projects.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <CategoryDialogContent
            category={editingCategory}
            onSave={handleSave}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingCategory(null);
            }}
          />
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>All Budget Categories</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[45%]">Category</TableHead>
                  <TableHead className="w-[25%]">Cost Type</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFilteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedFilteredCategories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">
                        {cat.category}
                      </TableCell>
                      <TableCell>{cat.costType || 'N/A'}</TableCell>
                      <TableCell>{cat.notes || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(cat)}>
                              Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete category?
                                  </AlertDialogTitle>
                                </AlertDialogHeader>
                                <p className="px-6 text-sm text-muted-foreground">
                                  This action cannot be undone.
                                </p>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(cat.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryDialogContent({
  category,
  onSave,
  onClose,
}: {
  category: BudgetCategory | null;
  onSave: (data: Omit<BudgetCategory, 'id'> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [categoryName, setCategoryName] = useState(category?.category ?? '');
  const [costType, setCostType] = useState(category?.costType ?? '');
  const [notes, setNotes] = useState(category?.notes ?? '');

  const isEditing = !!category;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: category?.id,
      category: categoryName.trim(),
      costType: costType.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Budget Category' : 'New Budget Category'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category</Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-costType">Cost Type</Label>
            <Input
              id="category-costType"
              value={costType}
              onChange={(e) => setCostType(e.target.value)}
              placeholder="e.g., Sitework, Electrical"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-notes">Notes</Label>
            <Input
              id="category-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
