// src/app/(app)/contractors/vendors/page.tsx
'use client';

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, Pencil } from "lucide-react";

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

import { vendorsData, type Vendor } from "./vendors-data";

const STORAGE_KEY = "vendors";

type EditableVendor = Vendor;

export default function VendorsPage() {
  const [vendors, setVendors] = React.useState<EditableVendor[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Dialog state for create/edit
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingVendor, setEditingVendor] = React.useState<EditableVendor | null>(null);

  const [name, setName] = React.useState("");
  const [trade, setTrade] = React.useState("");
  const [contactPerson, setContactPerson] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");

  // Load initial vendors: static + localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRaw = window.localStorage.getItem(STORAGE_KEY);
    let stored: EditableVendor[] = [];
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw) as EditableVendor[];
        if (Array.isArray(parsed)) {
          stored = parsed;
        }
      } catch {
        // ignore parse errors
      }
    }

    // Merge static + stored by id
    const byId = new Map<string, EditableVendor>();
    [...vendorsData, ...stored].forEach((v) => {
      byId.set(v.id, v);
    });

    const merged = Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setVendors(merged);
    setIsMounted(true);
  }, []);

  // Persist to localStorage when vendors change
  React.useEffect(() => {
    if (!isMounted) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors));
  }, [vendors, isMounted]);

  const openCreateDialog = () => {
    setEditingVendor(null);
    setName("");
    setTrade("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (vendor: EditableVendor) => {
    setEditingVendor(vendor);
    setName(vendor.name);
    setTrade(vendor.trade);
    setContactPerson(vendor.contactPerson);
    setPhone(vendor.phone);
    setEmail(vendor.email);
    setIsDialogOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (editingVendor) {
      // Update existing
      const updated: EditableVendor = {
        ...editingVendor,
        name: name.trim(),
        trade: trade.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
      };

      setVendors((prev) =>
        prev
          .map((v) => (v.id === editingVendor.id ? updated : v))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } else {
      // Create new
      const newVendor: EditableVendor = {
        id: crypto.randomUUID(),
        name: name.trim(),
        trade: trade.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
      };

      setVendors((prev) =>
        [...prev, newVendor].sort((a, b) => a.name.localeCompare(b.name))
      );
    }

    setIsDialogOpen(false);
    setEditingVendor(null);
  };

  const handleDeleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  const filteredVendors = vendors.filter((v) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      v.name.toLowerCase().includes(term) ||
      v.trade.toLowerCase().includes(term) ||
      v.contactPerson.toLowerCase().includes(term)
    );
  });

  if (!isMounted) {
    return <div className="p-8">Loading vendors...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Vendors
          </h1>
          <p className="text-muted-foreground">
            Manage all your subcontractors, suppliers, and service providers.
          </p>
        </div>

        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Vendor
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Vendor List</CardTitle>
          <Input
            placeholder="Search by name, trade, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="min-w-[150px]">Trade</TableHead>
                  <TableHead className="min-w-[160px]">Contact Person</TableHead>
                  <TableHead className="min-w-[130px]">Phone</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No vendors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.trade}</TableCell>
                      <TableCell>{vendor.contactPerson}</TableCell>
                      <TableCell>{vendor.phone}</TableCell>
                      <TableCell className="truncate max-w-xs">
                        {vendor.email}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(vendor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVendor(vendor.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? "Edit Vendor" : "New Vendor"}
            </DialogTitle>
            <DialogDescription>
              {editingVendor
                ? "Update the vendor details."
                : "Add a new vendor. It will be available in Estimating and other pages."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveVendor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Name</Label>
              <Input
                id="vendor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., A & G Electric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-trade">Trade</Label>
              <Input
                id="vendor-trade"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                placeholder="e.g., Electric, Concrete, HVAC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-contact">Contact Person</Label>
              <Input
                id="vendor-contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input
                id="vendor-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., 713-555-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-email">Email</Label>
              <Input
                id="vendor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., vendor@example.com"
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingVendor ? "Save Changes" : "Create Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
