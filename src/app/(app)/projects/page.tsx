'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Plus,
  CloudUpload,
  CloudDownload,
  UploadCloud,
} from 'lucide-react';

import {
  projectsData as templateProjects,
  type Project,
} from './projects-data';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const STORAGE_KEY = 'projects';

type StatusFilter = 'all' | Project['status'];

type ProjectFormState = {
  id?: string; // present in edit mode
  name: string;
  client: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  description: string;
  internalContractAmount: string; // kept in form only
  finalBid: string;
  status: Project['status'];
  progress: string;
  startDate: string;
  endDate: string;
  imageUrl: string; // data URL or external URL
};

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseMoneyInput(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[\$,]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilter>('all');

  const [isSavingSnapshot, setIsSavingSnapshot] =
    React.useState(false);
  const [isLoadingSnapshot, setIsLoadingSnapshot] =
    React.useState(false);

  // unified “Create / Edit Project” dialog
  const [projectForm, setProjectForm] =
    React.useState<ProjectFormState | null>(null);
  const fileInputRef =
    React.useRef<HTMLInputElement | null>(null);

  const dialogOpen = projectForm !== null;

  // ---------- Initial load ----------
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
      console.error('Failed to read projects from localStorage:', err);
      setProjects(templateProjects as Project[]);
    } finally {
      setIsMounted(true);
    }
  }, []);

  // ---------- Persist to localStorage ----------
  React.useEffect(() => {
    if (!isMounted) return;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(projects),
        );
      }
    } catch (err) {
      console.error('Failed to save projects to localStorage:', err);
    }
  }, [projects, isMounted]);

  // ---------- Snapshot: save to Supabase ----------
  const handleSaveSnapshot = async () => {
    try {
      setIsSavingSnapshot(true);
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects }),
      });

      if (!res.ok) {
        console.error(await res.text());
        alert('Failed to save snapshot to cloud.');
        return;
      }

      alert('Snapshot saved to cloud.');
    } catch (err) {
      console.error(err);
      alert('Error while saving snapshot.');
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // ---------- Snapshot: load from Supabase ----------
  const handleLoadSnapshot = async () => {
    try {
      setIsLoadingSnapshot(true);
      const res = await fetch('/api/snapshot', {
        method: 'GET',
      });

      if (!res.ok) {
        console.error(await res.text());
        alert(
          'No valid snapshot found in the cloud. Keeping your current projects.',
        );
        return;
      }

      const data = await res.json();

      if (Array.isArray(data.projects) && data.projects.length > 0) {
        setProjects(data.projects as Project[]);
        alert(
          `Loaded snapshot with ${data.projects.length} projects from the cloud.`,
        );
      } else {
        alert(
          'No projects found in the latest snapshot. Keeping your current projects.',
        );
      }
    } catch (err) {
      console.error(err);
      alert('Error while loading snapshot.');
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  // ---------- Open dialog: create ----------
  const openCreateProjectDialog = () => {
    setProjectForm({
      id: undefined,
      name: '',
      client: '',
      streetAddress: '',
      city: '',
      zipCode: '',
      description: '',
      internalContractAmount: '',
      finalBid: '',
      status: 'Planning',
      progress: '0',
      startDate: '',
      endDate: '',
      imageUrl: '',
    });
  };

  // ---------- Open dialog: edit ----------
  const openEditProjectDialog = (project: Project) => {
    setProjectForm({
      id: project.id,
      name: project.name ?? '',
      client: project.client ?? '',
      streetAddress: project.streetAddress ?? '',
      city: project.city ?? '',
      zipCode: project.zipCode ?? '',
      description: project.description ?? '',
      internalContractAmount: '', // we don't currently persist this
      finalBid:
        project.finalBid != null
          ? String(project.finalBid)
          : '',
      status: project.status,
      progress: String(project.progress ?? 0),
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      imageUrl: project.imageUrl ?? '',
    });
  };

  const closeProjectDialog = () => setProjectForm(null);

  // ---------- Save / update project from dialog ----------
  const handleProjectFormSubmit = () => {
    if (!projectForm) return;

    const trimmedName = projectForm.name.trim();
    if (!trimmedName) {
      alert('Please enter a project name.');
      return;
    }

    const finalBidNumber = parseMoneyInput(projectForm.finalBid);
    const progressNumber =
      Number(projectForm.progress) || 0;

    const baseFields = {
      name: trimmedName,
      client:
        projectForm.client.trim() || 'ABC Development Corp',
      status: projectForm.status,
      progress: Math.max(0, Math.min(100, progressNumber)),
      startDate: projectForm.startDate,
      endDate: projectForm.endDate,
      streetAddress: projectForm.streetAddress.trim(),
      city: projectForm.city.trim(),
      zipCode: projectForm.zipCode.trim(),
      description: projectForm.description.trim(),
      finalBid: finalBidNumber,
      imageUrl: projectForm.imageUrl,
      imageHint: trimmedName,
    };

    const isEditMode = !!projectForm.id;

    if (isEditMode) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectForm.id
            ? {
                ...p,
                ...baseFields,
              }
            : p,
        ),
      );
    } else {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `proj-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`;

      const newProject: Project = {
        id,
        ...baseFields,
        budget: 0,
        spent: 0,
        team: [],
        budgetData: [],
        expensesData: [],
        getReimbursedData: [],
        milestonesData: [],
        drawingsData: [],
        scheduleData: [],
        clientUploadsData: [],
        changeOrdersData: [],
        applicationsData: [],
      };

      setProjects((prev) => [newProject, ...prev]);
    }

    closeProjectDialog();
  };

  const handleDeleteProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    const name = project?.name ?? 'this project';
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // ---------- Image upload ----------
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !projectForm) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProjectForm((prev) =>
        prev
          ? {
              ...prev,
              imageUrl: dataUrl,
            }
          : prev,
      );
    };
    reader.readAsDataURL(file);
  };

  // ---------- Derived / filtered list ----------
  const filteredProjects = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return projects.filter((project) => {
      const matchesSearch =
        !term ||
        project.name.toLowerCase().includes(term) ||
        project.client.toLowerCase().includes(term) ||
        (project.city ?? '').toLowerCase().includes(term) ||
        (project.zipCode ?? '').toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  // ---------- Card metric helpers ----------
  const getTotalBudget = (project: Project) => {
    const items = (project.budgetData ?? []) as any[];
    return items.reduce(
      (sum, item) => sum + (item.originalBudget ?? 0),
      0,
    );
  };

  const getTotalSpent = (project: Project) => {
    const items = (project.expensesData ?? []) as any[];
    return items.reduce(
      (sum, item) => sum + (item.amount ?? 0),
      0,
    );
  };

  const getProfitLoss = (project: Project) => {
    const finalBid =
      project.finalBid ??
      (project.budgetData ?? []).reduce(
        (sum: number, item: any) =>
          sum + (item.finalBidToCustomer ?? 0),
        0,
      );
    const spent = getTotalSpent(project);
    return finalBid - spent;
  };

  const getBudgetStatusPercent = (project: Project) => {
    const budget = getTotalBudget(project);
    const spent = getTotalSpent(project);
    if (budget <= 0) return 0;
    return Math.min(200, (spent / budget) * 100);
  };

  const getStatusBadgeColor = (status: Project['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-700';
      case 'Planning':
        return 'bg-amber-100 text-amber-700';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'On Hold':
      default:
        return 'bg-slate-200 text-slate-700';
    }
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
      {/* Create / Edit Project dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeProjectDialog();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {projectForm?.id
                ? 'Edit Project'
                : 'Create New Project'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Fill out the details below to create a new
              construction project.
            </p>
          </DialogHeader>

          {projectForm && (
            <div className="grid gap-4 py-2">
              {/* Project Name */}
              <div className="space-y-1">
                <Label>Project Name</Label>
                <Input
                  placeholder="e.g., Riverfront Residences"
                  value={projectForm.name}
                  onChange={(e) =>
                    setProjectForm((f) =>
                      f
                        ? { ...f, name: e.target.value }
                        : f,
                    )
                  }
                />
              </div>

              {/* Project Image */}
              <div className="space-y-2">
                <Label>Project Image</Label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-24 w-40 items-center justify-center rounded-md border border-dashed bg-muted/40 overflow-hidden">
                    {projectForm.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={projectForm.imageUrl}
                        alt={projectForm.name || 'Project image'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-xs text-muted-foreground gap-1">
                        <UploadCloud className="h-5 w-5" />
                        <span>Upload image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                    >
                      Choose File
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG or JPG, up to ~2MB.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              </div>

              {/* Client */}
              <div className="space-y-1">
                <Label>Client</Label>
                <Input
                  placeholder="e.g., ABC Development Corp"
                  value={projectForm.client}
                  onChange={(e) =>
                    setProjectForm((f) =>
                      f
                        ? { ...f, client: e.target.value }
                        : f,
                    )
                  }
                />
              </div>

              {/* Street address */}
              <div className="space-y-1">
                <Label>Street Address</Label>
                <Input
                  placeholder="e.g., 123 Main St"
                  value={projectForm.streetAddress}
                  onChange={(e) =>
                    setProjectForm((f) =>
                      f
                        ? {
                            ...f,
                            streetAddress: e.target.value,
                          }
                        : f,
                    )
                  }
                />
              </div>

              {/* City / Zip */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input
                    placeholder="e.g., Metropolis"
                    value={projectForm.city}
                    onChange={(e) =>
                      setProjectForm((f) =>
                        f
                          ? {
                              ...f,
                              city: e.target.value,
                            }
                          : f,
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Zip Code</Label>
                  <Input
                    placeholder="e.g., 12345"
                    value={projectForm.zipCode}
                    onChange={(e) =>
                      setProjectForm((f) =>
                        f
                          ? {
                              ...f,
                              zipCode: e.target.value,
                            }
                          : f,
                      )
                    }
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label>Description</Label>
                <textarea
                  className="w-full rounded-md border border-input px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Project details and scope..."
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm((f) =>
                      f
                        ? {
                            ...f,
                            description: e.target.value,
                          }
                        : f,
                    )
                  }
                />
              </div>

              {/* Internal contract / final bid */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Internal Contract Amount</Label>
                  <Input
                    placeholder="0"
                    value={projectForm.internalContractAmount}
                    onChange={(e) =>
                      setProjectForm((f) =>
                        f
                          ? {
                              ...f,
                              internalContractAmount:
                                e.target.value,
                            }
                          : f,
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Final Bid to Customer</Label>
                  <Input
                    placeholder="0"
                    value={projectForm.finalBid}
                    onChange={(e) =>
                      setProjectForm((f) =>
                        f
                          ? {
                              ...f,
                              finalBid: e.target.value,
                            }
                          : f,
                      )
                    }
                  />
                </div>
              </div>

              {/* Status / progress */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={projectForm.status}
                    onValueChange={(value) =>
                      setProjectForm((f) =>
                        f
                          ? {
                              ...f,
                              status:
                                value as Project['status'],
                            }
                          : f,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Planning" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">
                        Planning
                      </SelectItem>
                      <SelectItem value="Active">
                        In Progress
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
                    placeholder="0"
                    value={projectForm.progress}
                    onChange={(e) =>
                      setProjectForm((f) =>
                        f
                          ? {
                              ...f,
                              progress: e.target.value,
                            }
                          : f,
                      )
                    }
                  />
                </div>
              </div>

              {/* Start / end dates */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) =>
                      setProjectForm((f) =>
                        f
                          ? {
                              ...f,
                              startDate: e.target.value,
                            }
                          : f,
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) =>
                      setProjectForm((f) =>
                        f
                          ? {
                              ...f,
                              endDate: e.target.value,
                            }
                          : f,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeProjectDialog}
            >
              Cancel
            </Button>
            <Button onClick={handleProjectFormSubmit}>
              {projectForm?.id ? 'Save Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all your construction projects from start to finish.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveSnapshot}
            disabled={isSavingSnapshot}
          >
            <CloudUpload className="mr-2 h-4 w-4" />
            {isSavingSnapshot
              ? 'Saving…'
              : 'Save Snapshot to Cloud'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSnapshot}
            disabled={isLoadingSnapshot}
          >
            <CloudDownload className="mr-2 h-4 w-4" />
            {isLoadingSnapshot
              ? 'Loading…'
              : 'Load Latest Snapshot'}
          </Button>
          <Button onClick={openCreateProjectDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-md">
          <Input
            placeholder="Search by project name, client, city, or zip"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Status
          </span>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as StatusFilter)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="Active">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No projects found. Try adjusting your filters or add a new
          project.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {filteredProjects.map((project) => {
            const totalBudget = getTotalBudget(project);
            const spent = getTotalSpent(project);
            const pl = getProfitLoss(project);
            const budgetPct = getBudgetStatusPercent(project);

            const maxVal = Math.max(
              project.finalBid ?? 0,
              totalBudget,
              spent,
              Math.abs(pl),
              1,
            );
            const barHeight = (val: number) =>
              `${(val / maxVal) * 80 || 2}%`;

            return (
              <Card
                key={project.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  router.push(`/projects/${project.id}`)
                }
              >
                {/* Image strip */}
                <div className="h-40 w-full bg-slate-200 overflow-hidden">
                  {project.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.imageUrl}
                      alt={project.imageHint || project.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                      Project elevation / hero image
                    </div>
                  )}
                </div>

                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3 pt-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold">
                      {project.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {project.description ||
                        `${project.city ?? ''} ${
                          project.zipCode ?? ''
                        }`.trim()}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                        project.status,
                      )}`}
                    >
                      {project.status === 'Active'
                        ? 'In Progress'
                        : project.status}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            openEditProjectDialog(project)
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/projects/${project.id}`,
                            )
                          }
                        >
                          Open Project
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            handleDeleteProject(project.id)
                          }
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pb-5 pt-0">
                  {/* Budget status */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">
                        Budget Status
                      </span>
                      <span className="text-muted-foreground">
                        {budgetPct.toFixed(1)}% Used
                      </span>
                    </div>
                    <Progress value={budgetPct} />
                  </div>

                  {/* Money stats + tiny bars */}
                  <div className="grid gap-4 md:grid-cols-[2fr,1fr] items-end">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                      <div>
                        <div className="text-muted-foreground">
                          Final Bid
                        </div>
                        <div className="font-semibold">
                          $
                          {formatMoney(
                            project.finalBid ?? 0,
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Total Budget (cost)
                        </div>
                        <div className="font-semibold">
                          ${formatMoney(totalBudget)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Spent to Date
                        </div>
                        <div className="font-semibold">
                          ${formatMoney(spent)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Remaining Budget
                        </div>
                        <div className="font-semibold">
                          $
                          {formatMoney(
                            Math.max(totalBudget - spent, 0),
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-muted-foreground">
                          Profit / Loss
                        </div>
                        <div
                          className={`font-semibold ${
                            pl >= 0
                              ? 'text-emerald-600'
                              : 'text-destructive'
                          }`}
                        >
                          ${formatMoney(pl)}
                        </div>
                      </div>
                    </div>

                    {/* Mini bar chart */}
                    <div className="flex h-24 items-end justify-between gap-3">
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-4 rounded-t bg-emerald-500"
                          style={{
                            height: barHeight(
                              project.finalBid ?? 0,
                            ),
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Final Bid
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-4 rounded-t bg-blue-500"
                          style={{
                            height: barHeight(totalBudget),
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Budget
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-4 rounded-t bg-amber-500"
                          style={{
                            height: barHeight(spent),
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Spent
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-4 rounded-t ${
                            pl >= 0
                              ? 'bg-emerald-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            height: barHeight(Math.abs(pl)),
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Profit/Loss
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">
                        Timeline:{' '}
                      </span>
                      {project.startDate && project.endDate
                        ? `${project.startDate} → ${project.endDate}`
                        : 'Dates not set'}
                    </div>
                    <Link
                      href={`/projects/${project.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Open Project
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
