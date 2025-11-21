
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Smartphone, Monitor, MoreHorizontal, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

type Session = {
    id: string;
    device: string;
    browser: string;
    location: string;
    isCurrent: boolean;
    icon: React.ElementType;
};

const initialSessions: Session[] = [
    { id: '1', device: 'Windows PC', browser: 'Chrome', location: 'New York, USA', isCurrent: true, icon: Monitor },
    { id: '2', device: 'iPhone 13', browser: 'Safari', location: 'New York, USA', isCurrent: false, icon: Smartphone },
];

export function SecurityForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
    const [sessions, setSessions] = React.useState<Session[]>(initialSessions);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        const savedTwoFactor = localStorage.getItem('twoFactorEnabled');
        if (savedTwoFactor) {
            setTwoFactorEnabled(JSON.parse(savedTwoFactor));
        }
        setIsMounted(true);
    }, []);
    
    React.useEffect(() => {
        if (isMounted) {
            localStorage.setItem('twoFactorEnabled', JSON.stringify(twoFactorEnabled));
        }
    }, [twoFactorEnabled, isMounted]);

    const handleUpdatePassword = () => {
        if (newPassword !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'New passwords do not match.',
            });
            return;
        }
        if (newPassword.length < 8) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Password must be at least 8 characters long.',
            });
            return;
        }

        // Simulate password update
        toast({
            title: 'Success',
            description: 'Password updated successfully.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleSignOut = (sessionId: string) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        toast({
            title: 'Session Signed Out',
            description: 'The selected session has been signed out.',
        });
    };
    
    const handleSignOutAll = () => {
        setSessions(prev => prev.filter(s => s.isCurrent));
        // In a real app, this would also invalidate other sessions on the server
        localStorage.removeItem('isLoggedIn');
        router.push('/login');
         toast({
            title: 'Success',
            description: 'You have been signed out of all other devices.',
        });
    };

    if (!isMounted) {
        return null;
    }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your password and account security.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
            <h3 className="font-medium">Change Password</h3>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div>
                <Button onClick={handleUpdatePassword}>Update Password</Button>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-medium">Two-Factor Authentication</h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Enable Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <h3 className="font-medium">Session Management</h3>
            <p className="text-sm text-muted-foreground">You're currently signed in on these devices.</p>
            <div className="space-y-4">
                {sessions.map(session => {
                    const Icon = session.icon;
                    return (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                                <Icon className="h-6 w-6 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{session.device} - {session.browser}</p>
                                    <p className="text-sm text-muted-foreground">{session.location} - {session.isCurrent ? 'Current session' : 'Last active 2 hours ago'}</p>
                                </div>
                            </div>
                            {!session.isCurrent && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleSignOut(session.id)} className="text-destructive">
                                            Sign out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    );
                })}
            </div>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out of all other devices
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will sign you out of all other active sessions on all devices.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSignOutAll}>Sign Out</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
