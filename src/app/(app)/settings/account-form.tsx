
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function AccountForm() {
  const [language, setLanguage] = React.useState('en');
  const [timeZone, setTimeZone] = React.useState('est');
  const [dateFormat, setDateFormat] = React.useState('mm-dd-yyyy');
  const [theme, setTheme] = React.useState('light');
  const [isMounted, setIsMounted] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setLanguage(localStorage.getItem('accountLanguage') || 'en');
      setTimeZone(localStorage.getItem('accountTimeZone') || 'est');
      setDateFormat(localStorage.getItem('accountDateFormat') || 'mm-dd-yyyy');
      setTheme(localStorage.getItem('accountTheme') || 'light');
    }
    setIsMounted(true);
  }, []);

  const handleSave = () => {
    localStorage.setItem('accountLanguage', language);
    localStorage.setItem('accountTimeZone', timeZone);
    localStorage.setItem('accountDateFormat', dateFormat);
    localStorage.setItem('accountTheme', theme);
    toast({
      title: 'Preferences Saved',
      description: 'Your account preferences have been updated.',
    });
  };

  if (!isMounted) {
    return null; // Or a skeleton loader
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Preferences</CardTitle>
        <CardDescription>Manage your account settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
            <div className="grid grid-cols-[1fr_250px] items-center gap-4">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-[1fr_250px] items-center gap-4">
                <Label htmlFor="time-zone">Time Zone</Label>
                <Select value={timeZone} onValueChange={setTimeZone}>
                    <SelectTrigger id="time-zone">
                        <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="est">America/New_York (EST)</SelectItem>
                        <SelectItem value="pst">America/Los_Angeles (PST)</SelectItem>
                        <SelectItem value="cst">America/Chicago (CST)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-[1fr_250px] items-center gap-4">
                <Label htmlFor="date-format">Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger id="date-format">
                        <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-[1fr_250px] items-center gap-4">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme">
                        <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardContent>
       <CardFooter className="border-t pt-6 justify-end">
        <Button onClick={handleSave}>Save Preferences</Button>
      </CardFooter>
    </Card>
  );
}
