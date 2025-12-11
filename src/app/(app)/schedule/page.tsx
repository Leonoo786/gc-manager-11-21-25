'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
// NEW – dialog + form controls
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  differenceInCalendarDays,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
  startOfDay,
} from 'date-fns';

type ScheduleItemStatus = 'Scheduled' | 'In Progress' | 'Completed';
type ScheduleItemType = 'Task' | 'Milestone' | 'Meeting';

type ScheduleItem = {
  id: string;
  title: string;
  projectName: string;
  date: string; // ISO string, e.g. "2025-12-10"
  status: ScheduleItemStatus;
  assignedTo: string;
  type: ScheduleItemType;
};

// NEW – very small “project” and “vendor” shapes
type SimpleProject = {
  id: string;
  name: string;
};

type SimpleVendor = {
  id: string;
  name: string;
};

// Try to load projects from localStorage key "projects"
function loadProjects(): SimpleProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('projects');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p, idx) => ({
      id: String(p.id ?? idx),
      name: String(p.name ?? 'Untitled Project'),
    }));
  } catch {
    return [];
  }
}

// Try to load vendors from localStorage key "vendors"
function loadVendors(): SimpleVendor[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('vendors');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v, idx) => ({
      id: String(v.id ?? idx),
      name: String(v.name ?? v.vendorName ?? 'Unnamed Vendor'),
    }));
  } catch {
    return [];
  }
}


const STORAGE_KEY = 'scheduleItems';

const DEFAULT_SCHEDULE_ITEMS: ScheduleItem[] = [
  {
    id: 'sched-1',
    title: 'Groundbreaking',
    projectName: 'PowerMart',
    date: '2025-12-15',
    status: 'Scheduled',
    assignedTo: 'Karim',
    type: 'Milestone',
  },
  {
    id: 'sched-2',
    title: 'Temple 8845 Foundation Pour',
    projectName: 'Temple 8845',
    date: '2025-12-20',
    status: 'Scheduled',
    assignedTo: 'Site Superintendent',
    type: 'Task',
  },
];

function loadInitialSchedule(): ScheduleItem[] {
  if (typeof window === 'undefined') return DEFAULT_SCHEDULE_ITEMS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE_ITEMS;
    const parsed = JSON.parse(raw) as ScheduleItem[];
    if (!Array.isArray(parsed)) return DEFAULT_SCHEDULE_ITEMS;
    return parsed;
  } catch {
    return DEFAULT_SCHEDULE_ITEMS;
  }
}

export default function SchedulePage() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [items, setItems] = React.useState<ScheduleItem[]>(DEFAULT_SCHEDULE_ITEMS);
  const [search, setSearch] = React.useState('');

  // NEW – dropdown data
  const [projects, setProjects] = React.useState<SimpleProject[]>([]);
  const [vendors, setVendors] = React.useState<SimpleVendor[]>([]);

  // NEW – dialog + form state
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [formTitle, setFormTitle] = React.useState('');
  const [formProjectId, setFormProjectId] = React.useState('');
  const [formDate, setFormDate] = React.useState('');
  const [formStatus, setFormStatus] =
    React.useState<ScheduleItemStatus>('Scheduled');
  const [formVendorId, setFormVendorId] = React.useState('');
  const [formType, setFormType] =
    React.useState<ScheduleItemType>('Task');


  // mount & load from localStorage
    React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setItems(loadInitialSchedule());
      setProjects(loadProjects());
      setVendors(loadVendors());
    }
  }, []);


  // persist on change
  React.useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isMounted]);

  if (!isMounted) {
    return <div className="p-6 text-sm text-muted-foreground">Loading schedule…</div>;
  }

  const today = startOfDay(new Date());

  const upcomingCount = items.filter((item) => {
    const d = parseISO(item.date);
    return isAfter(d, today);
  }).length;

  const thisWeekCount = items.filter((item) => {
    const d = parseISO(item.date);
    return isWithinInterval(d, {
      start: today,
      end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
  }).length;

  const overdueCount = items.filter((item) => {
    const d = parseISO(item.date);
    return isBefore(d, today) && item.status !== 'Completed';
  }).length;

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.projectName.toLowerCase().includes(q) ||
      item.assignedTo.toLowerCase().includes(q)
    );
  });

  // --- actions ---

    // NEW – commit the form into a schedule item
  const handleSaveNewScheduleItem = () => {
    const today = startOfDay(new Date());
    const todayIso = today.toISOString().slice(0, 10);

    if (!formTitle.trim()) {
      window.alert('Please enter a Task / Milestone name.');
      return;
    }

    const project =
      projects.find((p) => p.id === formProjectId) ?? null;
    const vendor =
      vendors.find((v) => v.id === formVendorId) ?? null;

    const newItem: ScheduleItem = {
      id: `sched-${Date.now()}`,
      title: formTitle.trim(),
      projectName: project?.name ?? 'Unassigned',
      date: (formDate || todayIso).trim(),
      status: formStatus,
      assignedTo: vendor?.name ?? 'Unassigned',
      type: formType,
    };

    setItems((prev) => [...prev, newItem]);

    // reset & close
    setFormTitle('');
    setFormProjectId('');
    setFormDate('');
    setFormStatus('Scheduled');
    setFormVendorId('');
    setFormType('Task');
    setIsAddOpen(false);
  };


  const handleDeleteScheduleItem = (id: string) => {
    if (!window.confirm('Delete this schedule item?')) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleEditScheduleItem = (item: ScheduleItem) => {
    const title = window.prompt('Title:', item.title);
    if (!title) return;

    const projectName = window.prompt('Project name:', item.projectName) || item.projectName;
    const dateInput =
      window.prompt('Date (YYYY-MM-DD):', item.date) || item.date;
    const assignedTo =
      window.prompt('Assigned to:', item.assignedTo) || item.assignedTo;
    const statusInput =
      window.prompt(
        'Status (Scheduled, In Progress, Completed):',
        item.status,
      ) || item.status;
    const normalizedStatus = (statusInput.trim() as ScheduleItemStatus) || item.status;

    const updated: ScheduleItem = {
      ...item,
      title: title.trim(),
      projectName: projectName.trim(),
      date: dateInput.trim(),
      assignedTo: assignedTo.trim(),
      status: normalizedStatus,
    };

    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  };

  const formatDate = (iso: string) => {
    try {
      const d = parseISO(iso);
      const diff = differenceInCalendarDays(d, today);
      return `${iso}  ·  ${diff >= 0 ? `${diff} days from now` : `${Math.abs(diff)} days ago`}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            See upcoming milestones and tasks across all projects.
          </p>
        </div>

        <Button
          size="sm"
          className="mt-1"
          onClick={() => setIsAddOpen(true)}
        >
          + Add Schedule Item
        </Button>

      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Items</CardTitle>
            <CardDescription>Any item scheduled after today</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{upcomingCount}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CardDescription>Items scheduled in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{thisWeekCount}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
            <CardDescription>Past due and not completed</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-red-600">
            {overdueCount}
          </CardContent>
        </Card>
      </div>

      {/* Global schedule table */}
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Global Schedule</CardTitle>
            <CardDescription>
              Filter by project or status to focus on what matters today.
            </CardDescription>
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <Input
              placeholder="Search by task, project, status, or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task / Milestone</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                    No schedule items match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.projectName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(item.date)}
                    </TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.assignedTo}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditScheduleItem(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteScheduleItem(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
            {/* NEW – Add Schedule Item dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Schedule Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Task / Milestone */}
            <div className="space-y-1">
              <Label htmlFor="sched-title">Task / Milestone</Label>
              <Input
                id="sched-title"
                placeholder="e.g., Foundation pour"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            {/* Project dropdown */}
            <div className="space-y-1">
              <Label>Project</Label>
              <Select
                value={formProjectId}
                onValueChange={setFormProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="__none">No projects found</SelectItem>
                  ) : (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <Label htmlFor="sched-date">Date</Label>
              <Input
                id="sched-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={formStatus}
                onValueChange={(v) =>
                  setFormStatus(v as ScheduleItemStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To – vendors */}
            <div className="space-y-1">
              <Label>Assigned To (Vendor)</Label>
              <Select
                value={formVendorId}
                onValueChange={setFormVendorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length === 0 ? (
                    <SelectItem value="__none">No vendors found</SelectItem>
                  ) : (
                    vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={formType}
                onValueChange={(v) =>
                  setFormType(v as ScheduleItemType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Milestone">Milestone</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNewScheduleItem}>
              Save Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
