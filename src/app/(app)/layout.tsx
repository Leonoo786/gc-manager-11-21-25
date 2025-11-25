"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { AppSidebar } from "@/components/layout/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header"; // default export

type AppLayoutProps = {
  children: React.ReactNode;
};

/**
 * Routes for the mobile “Menu” dropdown.
 */
const mobileLinks: { title: string; href: string }[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Projects", href: "/projects" },
  { title: "Budget", href: "/budget" },
  { title: "Budget Categories", href: "/budget-categories" },
  { title: "Schedule", href: "/schedule" },
  { title: "Tasks", href: "/tasks" },
  { title: "Documents", href: "/documents" },
  { title: "Team", href: "/team" },
  { title: "Photos", href: "/photos" },
  { title: "Estimating", href: "/estimating" },
  { title: "Profit & Loss", href: "/profit-loss" },
  { title: "Reports", href: "/reports" },
  { title: "Contractors", href: "/contractors" },
  { title: "Vendors", href: "/vendors" },
  { title: "Settings", href: "/settings" },
];

function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b bg-background px-4 py-2 lg:hidden">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-medium hover:bg-muted"
        >
          <Menu className="h-4 w-4" />
          <span>Menu</span>
        </button>
      </div>

      {open && (
        <div className="mt-2 max-h-[60vh] space-y-1 overflow-y-auto rounded-md border bg-popover p-2 text-sm shadow-sm">
          {mobileLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-2 py-1",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider className="min-h-screen w-full flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <AppSidebar />
      </div>

      {/* Mobile top menu */}
      <div className="lg:hidden w-full">
        <MobileMenu />
      </div>

      {/* Main content area */}
      <SidebarInset className="flex-1 flex flex-col">
        {/* Top header (your existing header component) */}
        <Header />

        {/* Page content */}
        <main className="p-4 flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
