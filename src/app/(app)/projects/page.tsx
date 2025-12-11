'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CloudUpload, CloudDownload } from 'lucide-react';
import { differenceInDays, parse, isValid, format } from 'date-fns';


import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import {
  projectsData as templateProjects,
  type Project,
} from './projects-data';

const STORAGE_KEY = 'projects';

// --- Mini-chart helpers ------------------------------------------------------

const computeFinancials = (project: Project) => {
  const finalBid = project.finalBid ?? 0;

  const totalBudget = (project.budgetData ?? []).reduce(
    (sum: number, item: any) => sum + (item.originalBudget ?? 0),
    0,
  );

  const spent = (project.expensesData ?? []).reduce(
    (sum: number, exp: any) => sum + (exp.amount ?? 0),
    0,
  );

  function parseProjectDate(raw?: string | null): Date | null {
  if (!raw) return null;

  const formats = ['MM/dd/yyyy', 'MMM d, yyyy']; // support both picker + old format
  for (const fmt of formats) {
    try {
      const d = parse(raw, fmt, new Date());
      if (isValid(d)) return d;
    } catch {
      // ignore and try next format
    }
  }
  return null;
}

function computeTimelineInfo(project: Project) {
  const start = parseProjectDate((project as any).startDate);
  const end = parseProjectDate((project as any).endDate);
  const today = new Date();

  let daysFromStart = 0;
  let daysToEnd = 0;
  let totalDays = 0;

  if (start && end && start < end) {
    totalDays = Math.max(0, differenceInDays(end, start));
    daysFromStart = Math.max(0, differenceInDays(today, start));
    daysFromStart = Math.min(daysFromStart, totalDays);

    daysToEnd = Math.max(0, differenceInDays(end, today));
  }

  const startLabel = start ? format(start, 'MM/dd/yyyy') : 'No start date';
  const endLabel = end ? format(end, 'MM/dd/yyyy') : 'No end date';

  return { startLabel, endLabel, daysFromStart, daysToEnd, totalDays };
}

  const profitLoss = finalBid - spent;

  const max = Math.max(
    finalBid,
    totalBudget,
    spent,
    Math.abs(profitLoss),
    1, // avoid divide-by-zero
  );

  const pct = (v: number) => (max ? (v / max) * 100 : 0);

  return {
    finalBid,
    totalBudget,
    spent,
    profitLoss,
    bars: {
      finalBid: pct(finalBid),
      totalBudget: pct(totalBudget),
      spent: pct(spent),
      profitLoss: pct(Math.abs(profitLoss)),
    },
  };
};

// --- New Project form state shape --------------------------------------------

type NewProjectForm = {
  name: string;
  client: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  description: string;
  internalContractAmount: string;
  finalBidToCustomer: string;
  status: Project['status'];
  progress: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
};

const emptyForm: NewProjectForm = {
  name: '',
  client: '',
  streetAddress: '',
  city: '',
  zipCode: '',
  description: '',
  internalContractAmount: '0',
  finalBidToCustomer: '0',
  status: 'Planning',
  progress: '0',
  startDate: '',
  endDate: '',
  imageUrl: '',
};

// --- schedule / timeline helpers ---

function parseProjectDate(raw?: string | null): Date | null {
  if (!raw) return null;

  const formats = ['MM/dd/yyyy', 'MMM d, yyyy']; // support both picker + older text dates
  for (const fmt of formats) {
    try {
      const d = parse(raw, fmt, new Date());
      if (isValid(d)) return d;
    } catch {
      // try next format
    }
  }
  return null;
}

function computeTimelineInfo(project: Project) {
  const start = parseProjectDate((project as any).startDate);
  const end = parseProjectDate((project as any).endDate);
  const today = new Date();

  let daysFromStart = 0;
  let daysToEnd = 0;
  let totalDays = 0;

  if (start && end && start < end) {
    totalDays = Math.max(0, differenceInDays(end, start));
    daysFromStart = Math.max(0, differenceInDays(today, start));
    daysFromStart = Math.min(daysFromStart, totalDays);

    daysToEnd = Math.max(0, differenceInDays(end, today));
  }

  const startLabel = start ? format(start, 'MM/dd/yyyy') : 'No start date';
  const endLabel = end ? format(end, 'MM/dd/yyyy') : 'No end date';

  return { startLabel, endLabel, daysFromStart, daysToEnd, totalDays };
}

function getBudgetStatusColor(usedPercent: number): string {
  if (usedPercent < 60) {
    // Healthy – under 60% of budget used
    return 'bg-emerald-500';
  }
  if (usedPercent < 90) {
    // Getting high – 60–89%
    return 'bg-amber-400';
  }
  // Danger zone – 90%+ used
  return 'bg-red-500';
}



export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<Project['status'] | 'all'>('all');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProjectId, setEditingProjectId] =
    React.useState<string | null>(null);
  const [form, setForm] = React.useState<NewProjectForm>(emptyForm);

  // -------- Load initial projects from localStorage or template --------------

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProjects(JSON.parse(saved) as Project[]);
      } else {
        setProjects(templateProjects as Project[]);
      }
    } catch (err) {
      console.error('Failed to load projects from localStorage', err);
      setProjects(templateProjects as Project[]);
    }

    setIsMounted(true);
  }, []);

  // -------- Persist projects to localStorage ---------------------------------

  React.useEffect(() => {
    if (!isMounted) return;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      }
    } catch (err) {
      console.error('Failed to save projects to localStorage', err);
    }
  }, [projects, isMounted]);

  // -------- Snapshot to Supabase ---------------------------------------------

  const handleSaveSnapshot = async () => {
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects }),
      });

      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      alert('Snapshot saved to cloud.');
    } catch (err) {
      console.error('Save snapshot failed', err);
      alert('Failed to save snapshot. Please try again later.');
    }
  };

  const handleLoadSnapshot = async () => {
    try {
      const res = await fetch('/api/snapshot', {
        method: 'GET',
      });

      if (!res.ok) {
        if (res.status === 404) {
          alert(
            'No valid snapshot found in the cloud. Keeping your current projects',
          );
          return;
        }
        throw new Error(`Status ${res.status}`);
      }

      const data = (await res.json()) as { projects?: Project[] };
      if (!data.projects || data.projects.length === 0) {
        alert(
          'No valid snapshot found in the cloud. Keeping your current projects',
        );
        return;
      }

      setProjects(data.projects);
      alert(`Loaded snapshot with ${data.projects.length} projects.`);
    } catch (err) {
      console.error('Load snapshot failed', err);
      alert('Failed to load snapshot. Please try again later.');
    }
  };

  // -------- Filtered list for rendering --------------------------------------

  const filteredProjects = React.useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !searchTerm ||
        project.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (project.client ?? '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (project.city ?? '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (project.zipCode ?? '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  // -------- New / Edit Project dialog helpers --------------------------------

  const openNewProjectDialog = () => {
    setEditingProjectId(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setEditingProjectId(project.id);
    setForm({
      name: project.name,
      client: project.client ?? '',
      streetAddress: project.streetAddress ?? '',
      city: project.city ?? '',
      zipCode: project.zipCode ?? '',
      description: project.description ?? '',
      internalContractAmount: String(project.budget ?? 0),
      finalBidToCustomer: String(project.finalBid ?? 0),
      status: project.status,
      progress: String(project.progress ?? 0),
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      imageUrl: project.imageUrl ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleFormChange = (
    field: keyof NewProjectForm,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProjectImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleFormChange('imageUrl', String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const upsertProject = () => {
    const base: Project = {
      id: editingProjectId ?? `project-${Date.now()}`,
      name: form.name || 'Untitled Project',
      client: form.client,
      status: form.status,
      progress: Number(form.progress) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: Number(form.internalContractAmount) || 0,
      spent: 0,
      imageUrl:
        form.imageUrl ||
        '/images/placeholders/project-placeholder-wide.png',
      imageHint: '',
      streetAddress: form.streetAddress,
      city: form.city,
      zipCode: form.zipCode,
      description: form.description,
      finalBid: Number(form.finalBidToCustomer) || 0,
      budgetData: editingProjectId
        ? projects.find((p) => p.id === editingProjectId)?.budgetData ??
          []
        : [],
      expensesData: editingProjectId
        ? projects.find((p) => p.id === editingProjectId)?.expensesData ??
          []
        : [],
      getReimbursedData: editingProjectId
        ? projects.find((p) => p.id === editingProjectId)
            ?.getReimbursedData ?? []
        : [],
      milestonesData: editingProjectId
        ? projects.find((p) => p.id === editingProjectId)
            ?.milestonesData ?? []
        : [],
      drawingsData: editingProjectId
        ? projects.find((p) => p.id === editingProjectId)
            ?.drawingsData ?? []
        : [],
      scheduleData: editingProjectId
        ? projects.find((p) => p.id === editingProjectId)
            ?.scheduleData ?? []
        : [],
      clientUploadsData: editingProjectId
        ? projects.find((p) => p.id === editingProjectId)
            ?.clientUploadsData ?? []
        : [],
      changeOrdersData: editingProjectId
        ? projects.find((p) => p.id === editingProjectId)
            ?.changeOrdersData ?? []
        : [],
      applicationsData: editingProjectId
        ? projects.find((p) => p.id === editingProjectId)
            ?.applicationsData ?? []
        : [],
    };

    if (editingProjectId) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProjectId ? base : p)),
      );
    } else {
      setProjects((prev) => [base, ...prev]);
    }

    setIsDialogOpen(false);
  };

  const deleteProject = (id: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this project?',
      )
    )
      return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  if (!isMounted) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Loading projects…
      </div>
    );
  }

  return (
    <>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top header row */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all your construction projects from start to
            finish.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveSnapshot}
          >
            <CloudUpload className="mr-2 h-4 w-4" />
            Save Snapshot to Cloud
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSnapshot}
          >
            <CloudDownload className="mr-2 h-4 w-4" />
            Load Latest Snapshot
          </Button>
          <Button size="sm" onClick={openNewProjectDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search by project name, client, city, or zip"
          className="md:max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Status
          </span>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as Project['status'] | 'all')
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project list */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No projects found. Try adjusting your filters or add a
              new project.
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => {
            const timeline = computeTimelineInfo(project);
            const financials = computeFinancials(project);

            
            const usedPercent =
            financials.totalBudget > 0
              ? Math.min(
                  100,
                  (financials.spent / financials.totalBudget) * 100,
                )
              : 0;


            

            return (
              <Card
                key={project.id}
                className="h-full flex flex-col overflow-hidden hover:border-primary/40 transition"
              >
                {/* Make entire card clickable */}
                <div
                  className="cursor-pointer flex-1 flex flex-col"
                  onClick={() =>
                    router.push(`/projects/${project.id}`)
                  }
                >
                  {/* Top image */}
                  {project.imageUrl && (
                    <div className="aspect-[5/1] w-full overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.imageUrl}
                        alt={project.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <CardHeader className="flex flex-col gap-1 border-b bg-white/60">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">
                          {project.name}
                        </CardTitle>
                        <CardDescription>
                          {project.client}
                          {project.city
                            ? ` • ${project.city}`
                            : ''}
                          {project.streetAddress
                            ? ` • ${project.streetAddress}`
                            : ''}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          project.status === 'Completed'
                            ? 'default'
                            : project.status === 'Active'
                            ? 'outline'
                            : 'secondary'
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                    
                    {/* Budget status bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Budget Status</span>
                      <span>{usedPercent.toFixed(1)}% Used</span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      {(() => {
                        const color = getBudgetStatusColor(usedPercent);
                        return (
                          <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${usedPercent}%` }}
                          />
                        );
                      })()}
                    </div>

 


  {/* schedule: dates + days */}
  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
    <div className="flex flex-col">
      <span>{timeline.startLabel}</span>
      {timeline.totalDays > 0 && (
        <span className="text-[10px]">
          {timeline.daysFromStart} days from start
        </span>
      )}
    </div>
    <div className="flex flex-col text-right">
      <span>{timeline.endLabel}</span>
      {timeline.totalDays > 0 && (
        <span className="text-[10px]">
          {timeline.daysToEnd} days to end
        </span>
      )}
    </div>
  </div>
</div>


                    {/* Numbers row */}
                    <div className="grid gap-4 text-xs md:grid-cols-4">
                      <div>
                        <div className="text-muted-foreground">
                          Final Bid
                        </div>
                        <div className="font-semibold">
                          $
                          {financials.finalBid.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Total Budget (cost)
                        </div>
                        <div className="font-semibold">
                          $
                          {financials.totalBudget.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Spent to Date
                        </div>
                        <div className="font-semibold">
                          $
                          {financials.spent.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Profit / Loss
                        </div>
                        <div
                          className={
                            'font-semibold ' +
                            (financials.profitLoss >= 0
                              ? 'text-emerald-600'
                              : 'text-red-500')
                          }
                        >
                          {financials.profitLoss >= 0 ? '+' : '-'}$
                          {Math.abs(
                            financials.profitLoss,
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Mini chart + Open Project / Edit / Delete */}
                    <div className="mt-4 flex flex-col items-end gap-4 md:flex-row md:items-end md:justify-between">
                      {/* Mini bar chart */}
                      <div className="flex items-end gap-4">
                        {/* Final Bid */}
                        <div className="flex flex-col items-center gap-1 text-[11px]">
                          <div
                            className="w-4 rounded-sm bg-sky-500"
                            style={{
                              height: `${financials.bars.finalBid * 0.7}px`,
                            }}
                          />
                          <span className="font-medium">
                            Final Bid
                          </span>
                        </div>

                        {/* Budget */}
                        <div className="flex flex-col items-center gap-1 text-[11px]">
                          <div
                            className="w-4 rounded-sm bg-slate-400"
                            style={{
                              height: `${financials.bars.totalBudget * 0.7}px`,
                            }}
                          />
                          <span className="font-medium">
                            Budget
                          </span>
                        </div>

                        {/* Spent */}
                        <div className="flex flex-col items-center gap-1 text-[11px]">
                          <div
                            className="w-4 rounded-sm bg-emerald-500"
                            style={{
                              height: `${financials.bars.spent * 0.7}px`,
                            }}
                          />
                          <span className="font-medium">
                            Spent
                          </span>
                        </div>

                        {/* Profit/Loss */}
                        <div className="flex flex-col items-center gap-1 text-[11px]">
                          <div
                            className={
                              'w-4 rounded-sm ' +
                              (financials.profitLoss >= 0
                                ? 'bg-emerald-600'
                                : 'bg-red-500')
                            }
                            style={{
                              height: `${financials.bars.profitLoss * 0.7}px`,
                            }}
                          />
                          <span className="font-medium">
                            Profit/Loss
                          </span>
                        </div>
                      </div>

                      {/* Right side buttons (don’t stop card click) */}
                      <div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(project)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProject(project.id)}
                        >
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/projects/${project.id}`)
                          }
                        >
                          Open Project
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })
        )}
      </div> {/* end max-w container */}

      {/* Create / Edit Project dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingProjectId
                ? 'Edit Project'
                : 'Create New Project'}
            </DialogTitle>
            <DialogDescription>
              Fill out the details below to create a new construction
              project.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label>Project Name</Label>
              <Input
                placeholder="e.g., Riverfront Residences"
                value={form.name}
                onChange={(e) =>
                  handleFormChange('name', e.target.value)
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
              <div className="space-y-1">
                <Label>Client</Label>
                <Input
                  placeholder="e.g., ABC Development Corp"
                  value={form.client}
                  onChange={(e) =>
                    handleFormChange('client', e.target.value)
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Project Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProjectImageChange}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
              <div className="space-y-1">
                <Label>Street Address</Label>
                <Input
                  placeholder="e.g., 123 Main St"
                  value={form.streetAddress}
                  onChange={(e) =>
                    handleFormChange(
                      'streetAddress',
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input
                    placeholder="e.g., Metropolis"
                    value={form.city}
                    onChange={(e) =>
                      handleFormChange('city', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Zip Code</Label>
                  <Input
                    placeholder="e.g., 12345"
                    value={form.zipCode}
                    onChange={(e) =>
                      handleFormChange('zipCode', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                placeholder="Project details and scope..."
                value={form.description}
                onChange={(e) =>
                  handleFormChange('description', e.target.value)
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Internal Contract Amount</Label>
                <Input
                  type="number"
                  value={form.internalContractAmount}
                  onChange={(e) =>
                    handleFormChange(
                      'internalContractAmount',
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Final Bid to Customer</Label>
                <Input
                  type="number"
                  value={form.finalBidToCustomer}
                  onChange={(e) =>
                    handleFormChange(
                      'finalBidToCustomer',
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    handleFormChange(
                      'status',
                      v as Project['status'],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">
                      Planning
                    </SelectItem>
                    <SelectItem value="Active">
                      Active
                    </SelectItem>
                    <SelectItem value="Completed">
                      Completed
                    </SelectItem>
                    <SelectItem value="On Hold">
                      On Hold
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Progress (%)</Label>
                <Input
                  type="number"
                  value={form.progress}
                  onChange={(e) =>
                    handleFormChange(
                      'progress',
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={form.startDate}
                  onChange={(e) =>
                    handleFormChange(
                      'startDate',
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={form.endDate}
                  onChange={(e) =>
                    handleFormChange('endDate', e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={upsertProject}>
              {editingProjectId
                ? 'Save Changes'
                : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
