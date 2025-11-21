"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Loader2,
  Plus,
  Search,
  Trash2,
  PencilLine,
} from "lucide-react";

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

import { vendorsData, type Vendor } from "./vendors-data";

const STORAGE_KEY = "vendors";

function getInitialVendors(): Vendor[] {
  if (typeof window === "undefined") return vendorsData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return vendorsData;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return vendorsData;
    return parsed as Vendor[];
  } catch {
    return vendorsData;
  }
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    setVendors(getInitialVendors());
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors));
    } catch (e) {
      console.warn("Could not save vendors to localStorage", e);
    }
  }, [vendors, isMounted]);

  const sortedAndFiltered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return [...vendors]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((v) => {
        if (!q) return true;
        return (
          v.name.toLowerCase().includes(q) ||
          (v.trade ?? "").toLowerCase().includes(q) ||
          (v.contactPerson ?? "").toLowerCase().includes(q) ||
          (v.email ?? "").toLowerCase().includes(q)
        );
      });
  }, [vendors, searchTerm]);

  const handleSaveVendor = (data: Omit<Vendor, "id">, existingId?: string) => {
    if (existingId) {
      setVendors((prev) =>
        prev.map((v) => (v.id === existingId ? { ...v, ...data } : v))
      );
    } else {
      const newVendor: Vendor = {
        ...data,
        id:
          data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
          "-" +
          Date.now().toString(),
      };
      setVendors((prev) => [...prev, newVendor]);
    }
    setEditingVendor(null);
    setIsDialogOpen(false);
  };

  const handleDeleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  if (!isMounted) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading vendors…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Vendors
          </h1>
          <p className="text-muted-foreground">
            Manage all company vendors and subcontractors.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingVendor(null);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVendor ? "Edit Vendor" : "New Vendor"}
              </DialogTitle>
              <DialogDescription>
                Add or edit a vendor. You can always change details later.
              </DialogDescription>
            </DialogHeader>
            <VendorForm
              vendor={editingVendor}
              onSubmit={handleSaveVendor}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          A list of all vendors and subcontractors available for your projects.
        </p>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search vendors..."
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
              <TableHead>Name</TableHead>
              <TableHead>Trade</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFiltered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-16 text-center text-xs text-muted-foreground"
                >
                  No vendors match your search.
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFiltered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {v.name}
                    </div>
                  </TableCell>
                  <TableCell>{v.trade ?? "N/A"}</TableCell>
                  <TableCell>{v.contactPerson ?? "N/A"}</TableCell>
                  <TableCell>{v.phone ?? "N/A"}</TableCell>
                  <TableCell>{v.email ?? "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingVendor(v);
                          setIsDialogOpen(true);
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteVendor(v.id)}
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

function VendorForm({
  vendor,
  onSubmit,
}: {
  vendor: Vendor | null;
  onSubmit: (data: Omit<Vendor, "id">, existingId?: string) => void;
}) {
  const [name, setName] = useState(vendor?.name ?? "");
  const [trade, setTrade] = useState(vendor?.trade ?? "");
  const [contactPerson, setContactPerson] = useState(
    vendor?.contactPerson ?? ""
  );
  const [phone, setPhone] = useState(vendor?.phone ?? "");
  const [email, setEmail] = useState(vendor?.email ?? "");

  const isEditing = !!vendor;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(
      {
        name: name.trim(),
        trade: trade.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      },
      vendor?.id
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Vendor Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Company or individual name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trade">Trade</Label>
        <Input
          id="trade"
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          placeholder="e.g., Electrical, Concrete, Plumbing"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact">Contact Person</Label>
          <Input
            id="contact"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="Main contact"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit">
          {isEditing ? "Save Changes" : "Add Vendor"}
        </Button>
      </div>
    </form>
  );
}
