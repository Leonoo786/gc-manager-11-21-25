"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/projects", label: "Projects" },
  { href: "/projects-test", label: "Projects Test" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
  // add/remove to match your real app
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white">
        <span className="font-semibold text-base">GC Manager</span>

        <div className="relative">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            Menu ▾
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-md z-50">
              <ul className="py-1 text-sm">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={[
                          "block px-3 py-2",
                          active
                            ? "bg-slate-100 font-medium"
                            : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-white">
        <div className="px-4 py-4 border-b">
          <span className="font-semibold text-lg">GC Manager</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "block rounded-md px-3 py-2 text-sm",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto w-full px-3 md:px-6 py-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
