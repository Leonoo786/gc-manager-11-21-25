// src/app/(app)/contractors/page.tsx
'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContractorsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Contractors
        </h1>
        <p className="text-muted-foreground">
          Manage vendors, subcontractors, and related contacts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View and manage your full vendor list used across projects and estimating.
            </p>
            <Button asChild>
              <Link href="/contractors/vendors">
                Go to Vendors
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Placeholder cards for future sections */}
        <Card>
          <CardHeader>
            <CardTitle>Subcontractors (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You can later add separate tracking for subcontractor agreements, scopes, and insurance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Store contracts, W-9s, and compliance documents per contractor.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
