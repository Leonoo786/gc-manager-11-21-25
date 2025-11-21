"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Layers2, Loader2, Plus, Search, Trash2, PencilLine } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  budgetCategoriesData,
  type BudgetCategory,
} from "./categories-data";

const STORAGE_KEY = "budgetCategories";

function getInitialCategories(): BudgetCategory[] {
  if (typeof window === "undefined") return budgetCategoriesData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return budgetCategoriesData;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return budgetCategoriesData;
    return parsed as BudgetCategory[];
  } catch {
    return budgetCategoriesData;
  }
}

export default function BudgetCategoriesPage() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(
    null
  );

  useEffect(() => {
    setCategories(getInitialCategories());
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.warn("Could not save budget categories", e);
    }
  }, [categories, isMounted]);

  const sortedAndFiltered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return [...categories]
      .sort((a, b) => a.category.localeCompare(b.category))
      .filter((c) => {
        if (!q) return true;
        return (
          c.category.toLowerCase().includes(q) ||
          c.costType.toLowerCase().includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q)
        );
      });
  }, [categories, searchTerm]);

  const handleSaveCategory = (
    data: Omit<BudgetCategory, "id">,
    existingId?: string
  ) => {
    if (existingId) {
      setCategories((prev) =>
        prev.map((c) => (c.id === existingId ? { ...c, ...data } : c))
      );
    } else {
      const newCategory: BudgetCategory = {
        ...data,
        id:
          data.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
          "-" +
          Date.now().toString(),
      };
      setCategories((prev) => [...prev, newCategory]);
    }
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  if (!isMounted) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading budget categories…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Budget Categories
          </h1>
          <p className="text-muted-foreground">
            Standardized cost categories for estimating and budget tracking.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCategory(null);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "New Category"}
              </DialogTitle>
              <DialogDescription>
                Add or update a budget category. These are used across projects.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              category={editingCategory}
              onSubmit={handleSaveCategory}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Category, cost type, and notes are all searchable.
        </p>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Cost Type</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFiltered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-16 text-center text-xs text-muted-foreground"
                >
                  No categories match your search.
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFiltered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Layers2 className="h-4 w-4 text-muted-foreground" />
                      {c.category}
                    </div>
                  </TableCell>
                  <TableCell>{c.costType}</TableCell>
                  <TableCell>{c.notes ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingCategory(c);
                          setIsDialogOpen(true);
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteCategory(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CategoryForm({
  category,
  onSubmit,
}: {
  category: BudgetCategory | null;
  onSubmit: (data: Omit<BudgetCategory, "id">, existingId?: string) => void;
}) {
  const [cat, setCat] = useState(category?.category ?? "");
  const [costType, setCostType] = useState(category?.costType ?? "");
  const [notes, setNotes] = useState(category?.notes ?? "");

  const isEditing = !!category;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cat.trim() || !costType.trim()) return;
    onSubmit(
      {
        category: cat.trim(),
        costType: costType.trim(),
        notes: notes.trim() || undefined,
      },
      category?.id
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          placeholder="e.g., Sitework Labor"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="costType">Cost Type</Label>
        <Input
          id="costType"
          value={costType}
          onChange={(e) => setCostType(e.target.value)}
          placeholder="e.g., Sitework"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes or grouping"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit">
          {isEditing ? "Save Changes" : "Add Category"}
        </Button>
      </div>
    </form>
  );
}
