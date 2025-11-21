'use client';

import * as React from 'react';
import { Search, Bell } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

import { getCurrentUser, type AuthUser } from '@/lib/auth';

export default function AppHeader() {
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
  }, []);

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'PM';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* Left: app + search */}
      <div className="flex flex-1 items-center gap-4">
        {/* App name (small on mobile) */}
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-sm font-semibold">
            Fancy Brothers Constructions
          </span>
          <span className="text-xs text-muted-foreground">
            Project Management Console
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects, tasks, or documents..."
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            {/* If you ever add avatarUrl to user, use AvatarImage */}
            {user && (user as any).avatarUrl ? (
              <AvatarImage
                src={(user as any).avatarUrl}
                alt={user.name}
                data-ai-hint="person face"
              />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-medium">
              {user?.name || 'Project Manager'}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.email || 'manager@example.com'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
