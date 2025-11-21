
'use client';
import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { type ScheduleItem } from './schedule-data';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { teamMembers } from '../../team/team-data';

function ScheduleItemForm({
    onSubmit,
    closeDialog,
    scheduleItem
}: {
    onSubmit: (item: Omit<ScheduleItem, 'id'>) => void;
    closeDialog: () => void;
    scheduleItem?: ScheduleItem | null;
}) {
    const [task, setTask] = React.useState(scheduleItem?.task || '');
    const [startDate, setStartDate] = React.useState<Date | undefined>(scheduleItem ? new Date(scheduleItem.dueDate) : undefined);
    const [endDate, setEndDate] = React.useState<Date | undefined>(scheduleItem ? new Date(scheduleItem.dueDate) : undefined);
    const [status, setStatus] = React.useState<ScheduleItem['status']>(scheduleItem?.status || 'To Do');
    const [assignee, setAssignee] = React.useState(scheduleItem?.assignee || '');
    const [priority, setPriority] = React.useState<ScheduleItem['priority']>(scheduleItem?.priority || 'Medium');
    const [notes, setNotes] = React.useState(''); // Notes not in data model yet

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!endDate) return;

        const newItem: Omit<ScheduleItem, 'id'> = {
            task,
            assignee: assignee || 'Unassigned',
            status,
            priority,
            dueDate: format(endDate, 'MMM d, yyyy')
        };
        onSubmit(newItem);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="task-name">Task Name</Label>
                <Input id="task-name" placeholder="e.g., Site Preparation" value={task} onChange={e => setTask(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={value => setStatus(value as ScheduleItem['status'])}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="To Do">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="assignee">Assignee (Optional)</Label>
                <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Unassigned">Unassigned</SelectItem>
                        {teamMembers.map(member => <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="priority">Priority (Optional)</Label>
                 <Select value={priority} onValueChange={value => setPriority(value as ScheduleItem['priority'])}>
                    <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any relevant notes for this task" />
            </div>

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Add to Schedule</Button>
            </DialogFooter>
        </form>
    )
}

export function ScheduleTable({ initialData }: { initialData: ScheduleItem[] }) {
    const [scheduleItems, setScheduleItems] = React.useState<ScheduleItem[]>(initialData);
    const [isAddItemOpen, setIsAddItemOpen] = React.useState(false);

    const handleAddItem = (item: Omit<ScheduleItem, 'id'>) => {
        const newItem: ScheduleItem = {
            ...item,
            id: (Date.now() + Math.random()).toString(),
        };
        setScheduleItems(prev => [newItem, ...prev]);
    }

    const getStatusBadgeClass = (status: 'To Do' | 'In Progress') => {
        switch (status) {
            case 'In Progress':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'To Do':
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getPriorityBadgeClass = (priority: 'High' | 'Medium' | 'Low') => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Low':
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Schedule</CardTitle>
            <CardDescription>
              View and manage the project timeline and tasks.
            </CardDescription>
          </div>
           <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Schedule Item
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Schedule Item</DialogTitle>
                        <DialogDescription>
                            Fill out the form below to add a new item to the project schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <ScheduleItemForm onSubmit={handleAddItem} closeDialog={() => setIsAddItemOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduleItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.task}</TableCell>
                <TableCell>{item.assignee}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusBadgeClass(item.status)}>{item.status}</Badge>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary" className={getPriorityBadgeClass(item.priority)}>{item.priority}</Badge>
                </TableCell>
                <TableCell>{item.dueDate}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
