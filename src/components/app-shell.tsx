"use client";

import * as React from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto w-full px-3 md:px-6 py-4 md:py-6">
        {children}
      </div>
    </div>
  );
}
