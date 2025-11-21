
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type NotificationSettings = {
  email: {
    taskAssignments: boolean;
    projectMilestones: boolean;
    documentUploads: boolean;
    commentsMentions: boolean;
    budgetApprovals: boolean;
  };
  inApp: {
    taskAssignments: boolean;
    projectMilestones: boolean;
    documentUploads: boolean;
    commentsMentions: boolean;
    budgetApprovals: boolean;
  };
  frequency: 'daily' | 'weekly' | 'never';
};

const defaultSettings: NotificationSettings = {
    email: {
        taskAssignments: true,
        projectMilestones: true,
        documentUploads: true,
        commentsMentions: true,
        budgetApprovals: true,
    },
    inApp: {
        taskAssignments: true,
        projectMilestones: true,
        documentUploads: true,
        commentsMentions: true,
        budgetApprovals: true,
    },
    frequency: 'daily',
};

export function NotificationsForm() {
  const [settings, setSettings] = React.useState<NotificationSettings>(defaultSettings);
  const [isMounted, setIsMounted] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    }
    setIsMounted(true);
  }, []);

  const handleEmailChange = (key: keyof NotificationSettings['email'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
  };

  const handleInAppChange = (key: keyof NotificationSettings['inApp'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      inApp: { ...prev.inApp, [key]: value },
    }));
  };

  const handleFrequencyChange = (value: 'daily' | 'weekly' | 'never') => {
    setSettings(prev => ({ ...prev, frequency: value }));
  };

  const handleSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    toast({
      title: 'Settings Saved',
      description: 'Your notification preferences have been updated.',
    });
  };

  if (!isMounted) {
    return null; // Or a skeleton loader
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Notifications</h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="task-assignments-email" className="flex flex-col space-y-1">
                <span>Task assignments and updates</span>
            </Label>
            <Switch id="task-assignments-email" checked={settings.email.taskAssignments} onCheckedChange={(val) => handleEmailChange('taskAssignments', val)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
             <Label htmlFor="project-milestones-email" className="flex flex-col space-y-1">
                <span>Project milestones</span>
            </Label>
            <Switch id="project-milestones-email" checked={settings.email.projectMilestones} onCheckedChange={(val) => handleEmailChange('projectMilestones', val)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="document-uploads-email" className="flex flex-col space-y-1">
                <span>Document uploads and updates</span>
            </Label>
            <Switch id="document-uploads-email" checked={settings.email.documentUploads} onCheckedChange={(val) => handleEmailChange('documentUploads', val)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="comments-mentions-email" className="flex flex-col space-y-1">
                <span>Comments and mentions</span>
            </Label>
            <Switch id="comments-mentions-email" checked={settings.email.commentsMentions} onCheckedChange={(val) => handleEmailChange('commentsMentions', val)} />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="budget-approvals-email" className="flex flex-col space-y-1">
                <span>Budget approvals and changes</span>
            </Label>
            <Switch id="budget-approvals-email" checked={settings.email.budgetApprovals} onCheckedChange={(val) => handleEmailChange('budgetApprovals', val)} />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">In-App Notifications</h3>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="task-assignments-in-app">Task assignments and updates</Label>
            <Switch id="task-assignments-in-app" checked={settings.inApp.taskAssignments} onCheckedChange={(val) => handleInAppChange('taskAssignments', val)} />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="project-milestones-in-app">Project milestones</Label>
            <Switch id="project-milestones-in-app" checked={settings.inApp.projectMilestones} onCheckedChange={(val) => handleInAppChange('projectMilestones', val)} />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="document-uploads-in-app">Document uploads and updates</Label>
            <Switch id="document-uploads-in-app" checked={settings.inApp.documentUploads} onCheckedChange={(val) => handleInAppChange('documentUploads', val)} />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="comments-mentions-in-app">Comments and mentions</Label>
            <Switch id="comments-mentions-in-app" checked={settings.inApp.commentsMentions} onCheckedChange={(val) => handleInAppChange('commentsMentions', val)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="budget-approvals-in-app">Budget approvals and changes</Label>
            <Switch id="budget-approvals-in-app" checked={settings.inApp.budgetApprovals} onCheckedChange={(val) => handleInAppChange('budgetApprovals', val)} />
          </div>
        </div>
        
        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Frequency</h3>
           <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="email-digest-frequency">Email digest frequency</Label>
                <Select value={settings.frequency} onValueChange={handleFrequencyChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>


      </CardContent>
      <CardFooter className="border-t pt-6 justify-end">
        <Button onClick={handleSave}>Save Notification Settings</Button>
      </CardFooter>
    </Card>
  );
}
