
'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, MoreHorizontal, Plus } from 'lucide-react';
import { type Milestone } from './milestones-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function MilestoneForm({
    onSubmit,
    closeDialog,
    milestone,
  }: {
    onSubmit: (milestone: Omit<Milestone, 'id'>) => void;
    closeDialog: () => void;
    milestone?: Milestone | null;
  }) {
    const [title, setTitle] = React.useState(milestone?.title || '');
    const [description, setDescription] = React.useState(milestone?.description || '');
    const [dueDate, setDueDate] = React.useState<Date | undefined>(milestone ? new Date(milestone.dueDate) : undefined);
    const [status, setStatus] = React.useState<Milestone['status']>(milestone?.status || 'In Progress');
  
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dueDate) return;
        const newMilestone: Omit<Milestone, 'id'> = {
            title,
            description,
            dueDate: format(dueDate, 'MMMM do, yyyy'),
            status,
        };
        onSubmit(newMilestone);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="milestone-name">Milestone Name</Label>
                <Input id="milestone-name" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Foundation Complete" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this milestone entails." />
            </div>
            <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
             <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                 <Select value={status} onValueChange={(value) => setStatus(value as Milestone['status'])}>
                    <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Upcoming">Upcoming</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save</Button>
            </DialogFooter>
        </form>
    );
}

export function MilestonesList({ initialData }: { initialData: Milestone[] }) {
  const [milestones, setMilestones] = React.useState<Milestone[]>(initialData);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = React.useState(false);

  const handleAddMilestone = (milestone: Omit<Milestone, 'id'>) => {
    const newMilestone: Milestone = {
        ...milestone,
        id: (Date.now() + Math.random()).toString(),
    };
    setMilestones(prev => [newMilestone, ...prev]);
  };
    
  const getStatusBadgeClass = (status: 'Completed' | 'In Progress' | 'Overdue' | 'Upcoming') => {
    switch (status) {
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Overdue':
          return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Milestones</CardTitle>
            <CardDescription>
              Track major project goals and deadlines.
            </CardDescription>
          </div>
          <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Milestone
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Milestone</DialogTitle>
                    <DialogDescription>Create a new milestone to track a major goal.</DialogDescription>
                </DialogHeader>
                <MilestoneForm onSubmit={handleAddMilestone} closeDialog={() => setIsAddMilestoneOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.map((milestone) => (
          <Card key={milestone.id} className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className='flex-1'>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{milestone.title}</h3>
                  <Badge variant="secondary" className={getStatusBadgeClass(milestone.status)}>
                    {milestone.status === 'Overdue' ? 'In Progress' : milestone.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                <p className="text-sm mt-2">
                  Due: <span className="font-medium">{milestone.dueDate}</span>
                  {milestone.status === 'Overdue' && <span className="text-destructive font-medium ml-2">(Overdue)</span>}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Mark as Complete</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
