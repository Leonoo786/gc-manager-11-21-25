'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default function RootRedirectPage() {
  const router = useRouter();
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    const user = getCurrentUser();

    if (user) {
      // Logged in → go straight to dashboard
      router.replace('/dashboard');
    } else {
      // Not logged in → go to login
      router.replace('/login');
    }

    setChecked(true);
  }, [router]);

  // Small fallback while redirect decision happens
  if (!checked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p>Loading…</p>
      </div>
    );
  }

  // After redirect is started, render nothing to avoid flicker
  return null;
}
