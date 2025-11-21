// src/app/(app)/estimating/page.tsx
'use client';

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  vendorsData,
  type Vendor,
} from "../contractors/vendors/vendors-data";
import {
  budgetCategoriesData,
  type BudgetCategory,
} from "../budget-categories/categories-data";

type EstimateLine = {
  id: string;
  categoryId: string | null;
  vendorId: string | null;
  description: string;
  quantity: number;
  unitCost: number;
};

const STORAGE_KEY = "estimatingLines";
const VENDORS_STORAGE_KEY = "vendors";

function createEmptyLine(): EstimateLine {
  return {
    id: crypto.randomUUID(),
    categoryId: null,
    vendorId: null,
    description: "",
    quantity: 1,
    unitCost: 0,
  };
}

export default function EstimatingPage() {
  const [lines, setLines] = React.useState<EstimateLine[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  // Vendors state (static + local)
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = React.useState(false);
  const [newVendorName, setNewVendorName] = React.useState("");
  const [newVendorTrade, setNewVendorTrade] = React.useState("");
  const [newVendorContact, setNewVendorContact] = React.useState("");
  const [newVendorPhone, setNewVendorPhone] = React.useState("");
  const [newVendorEmail, setNewVendorEmail] = React.useState("");

  // Load estimate lines + vendors on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) lines
    const storedLines = window.localStorage.getItem(STORAGE_KEY);
    if (storedLines) {
      try {
        const parsed = JSON.parse(storedLines) as EstimateLine[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLines(parsed);
        } else {
          setLines([createEmptyLine()]);
        }
      } catch {
        setLines([createEmptyLine()]);
      }
    } else {
      setLines([createEmptyLine()]);
    }

    // 2) vendors: merge static + localStorage
    const storedVendorsRaw = window.localStorage.getItem(
      VENDORS_STORAGE_KEY
    );
    let storedVendors: Vendor[] = [];
    if (storedVendorsRaw) {
      try {
        const parsed = JSON.parse(storedVendorsRaw) as Vendor[];
        if (Array.isArray(parsed)) {
          storedVendors = parsed;
        }
      } catch {
        // ignore
      }
    }

    // Merge by id; if ids collide, prefer stored version
    const byId = new Map<string, Vendor>();
    [...vendorsData, ...storedVendors].forEach((v) => {
      byId.set(v.id, v);
    });

    const merged = Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setVendors(merged);
    setIsMounted(true);
  }, []);

  // Persist estimate lines when they change
  React.useEffect(() => {
    if (!isMounted) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, isMounted]);

  // Persist vendors when they change (for Vendors page)
  React.useEffect(() => {
    if (!isMounted) return;
    // Only store vendors that are not in the original static list OR updated/custom
    // Easiest: just store them all; Vendors page will merge with static list the same way.
    window.localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(vendors));
  }, [vendors, isMounted]);

  const handleLineChange = <K extends keyof EstimateLine>(
    id: string,
    key: K,
    value: EstimateLine[K]
  ) => {
    setLines((prev) =>
      prev.map((line) =>
        line.id === id
          ? {
              ...line,
              [key]: value,
            }
          : line
      )
    );
  };

  const handleAddLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const handleDeleteLine = (id: string) => {
    setLines((prev) => {
      const filtered = prev.filter((line) => line.id !== id);
      return filtered.length > 0 ? filtered : [createEmptyLine()];
    });
  };

  const totals = React.useMemo(() => {
    const lineTotals = lines.map(
      (line) => line.quantity * line.unitCost
    );
    const subtotal = lineTotals.reduce((acc, v) => acc + v, 0);
    const grandTotal = subtotal;
    return { subtotal, grandTotal, lineTotals };
  }, [lines]);

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    const newVendor: Vendor = {
      id: crypto.randomUUID(),
      name: newVendorName.trim(),
      trade: newVendorTrade.trim() || "N/A",
      contactPerson: newVendorContact.trim() || "N/A",
      phone: newVendorPhone.trim() || "N/A",
      email: newVendorEmail.trim() || "N/A",
    };

    setVendors((prev) =>
      [...prev, newVendor].sort((a, b) => a.name.localeCompare(b.name))
    );

    // Reset form and close dialog
    setNewVendorName("");
    setNewVendorTrade("");
    setNewVendorContact("");
    setNewVendorPhone("");
    setNewVendorEmail("");
    setIsVendorDialogOpen(false);
  };

  if (!isMounted) {
    return <div className="p-8">Loading estimate...</div>;
  }

  const sortedCategories: BudgetCategory[] = [...budgetCategoriesData].sort(
    (a, b) => a.category.localeCompare(b.category)
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Estimating
        </h1>
        <p className="text-muted-foreground">
          Build estimates using your budget categories and vendor list.
        </p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Estimate Lines</CardTitle>
            <Button onClick={handleAddLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
        </Card>

        {/* Quick Add Vendor */}
        <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Quick Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Vendor</DialogTitle>
              <DialogDescription>
                This vendor will also appear in the main Vendors list.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-name">Name</Label>
                <Input
                  id="vendor-name"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  required
                  placeholder="e.g., My Favorite Supplier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-trade">Trade</Label>
                <Input
                  id="vendor-trade"
                  value={newVendorTrade}
                  onChange={(e) => setNewVendorTrade(e.target.value)}
                  placeholder="e.g., Electrical, Concrete, HVAC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-contact">Contact Person</Label>
                <Input
                  id="vendor-contact"
                  value={newVendorContact}
                  onChange={(e) => setNewVendorContact(e.target.value)}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-phone">Phone</Label>
                <Input
                  id="vendor-phone"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  placeholder="e.g., 713-555-1234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-email">Email</Label>
                <Input
                  id="vendor-email"
                  type="email"
                  value={newVendorEmail}
                  onChange={(e) => setNewVendorEmail(e.target.value)}
                  placeholder="e.g., vendor@example.com"
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save Vendor</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Category</TableHead>
                  <TableHead className="min-w-[180px]">Vendor</TableHead>
                  <TableHead className="min-w-[220px]">Description</TableHead>
                  <TableHead className="min-w-[90px] text-right">
                    Qty
                  </TableHead>
                  <TableHead className="min-w-[130px] text-right">
                    Unit Cost
                  </TableHead>
                  <TableHead className="min-w-[130px] text-right">
                    Line Total
                  </TableHead>
                  <TableHead className="w-[60px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => {
                  const lineTotal = totals.lineTotals[index] ?? 0;
                  return (
                    <TableRow key={line.id}>
                      {/* Category */}
                      <TableCell>
                        <Select
                          value={line.categoryId ?? ""}
                          onValueChange={(value) =>
                            handleLineChange(
                              line.id,
                              "categoryId",
                              value || null
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Vendor */}
                      <TableCell>
                        <Select
                          value={line.vendorId ?? ""}
                          onValueChange={(value) =>
                            handleLineChange(
                              line.id,
                              "vendorId",
                              value || null
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Description */}
                      <TableCell>
                        <Input
                          value={line.description}
                          onChange={(e) =>
                            handleLineChange(
                              line.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Optional description"
                        />
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="text-right"
                          value={line.quantity}
                          onChange={(e) =>
                            handleLineChange(
                              line.id,
                              "quantity",
                              Number(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>

                      {/* Unit Cost */}
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="text-right"
                          value={line.unitCost}
                          onChange={(e) =>
                            handleLineChange(
                              line.id,
                              "unitCost",
                              Number(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>

                      {/* Line Total */}
                      <TableCell className="text-right font-medium">
                        ${lineTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLine(line.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-12 border-t pt-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <div className="text-xl font-semibold">
                ${totals.subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">
                ${totals.grandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
