'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppHeader from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Client-side check for a simple "session"
    try {
      const session = typeof window !== 'undefined'
        ? localStorage.getItem('isLoggedIn')
        : null;

      if (session === 'true') {
        setIsAuthenticated(true);
      } else {
        // Not logged in → go to /login
        router.push('/login');
      }
    } catch (e) {
      console.error('Error reading auth state:', e);
      router.push('/login');
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  // While we’re checking localStorage, show a spinner-ish screen
  if (isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  // If not authenticated, we already pushed to /login above.
  // Return null so this layout doesn't render anything.
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
