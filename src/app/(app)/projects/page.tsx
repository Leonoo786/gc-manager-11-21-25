'use client';

import * as React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// TEMP: stub backend update so the UI doesn't crash when saving a project.
// Your UI already writes to localStorage, so this just echoes back the data.
async function updateProjectApi(id: string, data: any) {
  return { id, ...data };
}


import { Separator } from '@/components/ui/separator';
import {
  Filter,
  Plus,
  Search,
  Trash,
  Eye,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  Users,
  Upload,
  MoreHorizontal,
  FilePenLine,
  Target,
  Wallet,
  ArrowRightLeft,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { projectsData, type Project } from './projects-data';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isValid, parse } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';


// Safe wrapper around the backend API.
// If the API is missing or fails, we just return an empty list
// so the UI continues to work with localStorage projects only.
async function fetchProjects(): Promise<BackendProject[]> {
  try {
    const res = await fetch('/api/projects');

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(
      'Projects API fetch failed; using only local projects instead.',
      error
    );
    return [];
  }
}


type BackendProject = {
  id: string;
  name: string;
  description?: string;
  client?: string;
  streetAddress?: string;
  city?: string;
  zipCode?: string;
  budget?: number;
  finalBid?: number;
  status?: Project['status'];
  progress?: number;
  startDate?: string;
  endDate?: string;
  spent?: number;
  imageUrl?: string;
  imageHint?: string;
};

function mapBackendProjectToProject(p: BackendProject): Project {
  const anyP = p as any;

  return {
    id: p.id,
    name: p.name ?? 'Untitled Project',
    client: anyP.client ?? 'Unknown client',
    streetAddress: anyP.streetAddress ?? '',
    city: anyP.city ?? '',
    zipCode: anyP.zipCode ?? '',
    description: p.description ?? '',
    budget: anyP.budget ?? 0,
    finalBid: anyP.finalBid ?? 0,
    status: anyP.status ?? 'Active',
    progress: anyP.progress ?? 0,
    startDate: anyP.startDate ?? '',
    endDate: anyP.endDate ?? '',
    spent: anyP.spent ?? 0,
    imageUrl:
      anyP.imageUrl ??
      `https://picsum.photos/seed/project-${p.id}/600/400`,
    imageHint: anyP.imageHint ?? 'building construction',

    // safe defaults for all the arrays your UI expects
    team: anyP.team ?? [],
    budgetData: anyP.budgetData ?? [],
    expensesData: anyP.expensesData ?? [],
    getReimbursedData: anyP.getReimbursedData ?? [],
    milestonesData: anyP.milestonesData ?? [],
    drawingsData: anyP.drawingsData ?? [],
    scheduleData: anyP.scheduleData ?? [],
    clientUploadsData: anyP.clientUploadsData ?? [],
    changeOrdersData: anyP.changeOrdersData ?? [],
    applicationsData: anyP.applicationsData ?? [],
  } as Project;
}

const getInitialProjects = (): Project[] => {
  if (typeof window === 'undefined') {
    return projectsData;
  }
  const savedProjects = localStorage.getItem('projects');
  return savedProjects ? JSON.parse(savedProjects) : projectsData;
};

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}) {
  const {
    totalBudget,
    totalSpent,
    finalBid,
    remainingBudget,
    profitLoss,
    budgetStatus,
    daysIn,
    daysLeft,
  } = useMemo(() => {
    const budgetItems = (project as any).budgetData ?? [];
    const expenseItems = (project as any).expensesData ?? [];

    const budget = budgetItems.reduce(
      (acc: number, item: any) => acc + (item.originalBudget ?? 0),
      0
    );
    const spent = expenseItems.reduce(
      (acc: number, item: any) => acc + (item.amount ?? 0),
      0
    );
    const bid = budgetItems.reduce(
      (acc: number, item: any) => acc + (item.committedCost ?? 0),
      0
    );
    const profit = bid - spent;
    const status = budget > 0 ? (spent / budget) * 100 : 0;

    const startDate =
      project.startDate &&
      isValid(parse(project.startDate, 'MMM d, yyyy', new Date()))
        ? parse(project.startDate, 'MMM d, yyyy', new Date())
        : null;

    const endDate =
      project.endDate &&
      isValid(parse(project.endDate, 'MMM d, yyyy', new Date()))
        ? parse(project.endDate, 'MMM d, yyyy', new Date())
        : null;

    let dIn = 0;
    let dLeft = 0;

    if (startDate && endDate && startDate <= endDate) {
      const today = new Date();
      const diffIn = differenceInDays(today, startDate);
      const diffLeft = differenceInDays(endDate, today);
      dIn = diffIn > 0 ? diffIn : 0;
      dLeft = diffLeft > 0 ? diffLeft : 0;
    }

    return {
      totalBudget: budget,
      totalSpent: spent,
      finalBid: bid,
      remainingBudget: budget - spent,
      profitLoss: profit,
      budgetStatus: status,
      daysIn: dIn,
      daysLeft: dLeft,
    };
  }, [project]);

  // 🔑 NEW: safe image src so we never pass an empty string to <Image src="">
  const imageSrc =
    project.imageUrl && project.imageUrl.trim() !== ''
      ? project.imageUrl
      : `https://picsum.photos/seed/project-${project.id || 'fallback'}/600/400`;

  const financialChartData = [
    { name: 'Final Bid', value: finalBid, color: '#3b82f6' },
    { name: 'Total Budget', value: totalBudget, color: '#8b5cf6' },
    { name: 'Spent', value: totalSpent, color: '#ef4444' },
    {
      name: 'Profit/Loss',
      value: profitLoss,
      color: profitLoss >= 0 ? '#22c55e' : '#ef4444',
    },
  ];

  const getProgressColorClass = (progress: number) => {
    if (progress > 100) return '[&>*]:bg-destructive';
    if (progress > 75) return '[&>*]:bg-yellow-500';
    return '[&>*]:bg-blue-500';
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/projects/${project.id}`} passHref>
        <CardHeader className="p-0 relative h-48">
          <Image
            src={imageSrc}
            alt="Project Image"
            fill
            className="object-cover"
            data-ai-hint={project.imageHint}
          />
        </CardHeader>
      </Link>
      <CardContent className="p-6 space-y-4 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">{project.name}</h3>
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={
                project.status === 'Active'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }
            >
              {project.status === 'Active' ? 'In Progress' : project.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <FilePenLine className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the project.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(project.id)}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6">
          <div className="space-y-3 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Budget Status</span>
                <span>{budgetStatus.toFixed(1)}% Used</span>
              </div>
              <Progress
                value={budgetStatus}
                className={getProgressColorClass(budgetStatus)}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Final Bid:
              </span>
              <span className="font-medium">
                $
                {finalBid.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                Total Budget (cost):
              </span>
              <span className="font-medium">
                $
                {totalBudget.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ArrowRightLeft className="h-4 w-4" />
                Spent to Date:
              </span>
              <span className="font-medium">
                $
                {totalSpent.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Remaining Budget:
              </span>
              <span
                className={`font-medium ${
                  remainingBudget < 0
                    ? 'text-destructive'
                    : 'text-green-600'
                }`}
              >
                {remainingBudget < 0
                  ? `-$${Math.abs(remainingBudget).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : `$${remainingBudget.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Profit / Loss:
              </span>
              <span
                className={`font-medium ${
                  profitLoss < 0 ? 'text-destructive' : 'text-green-600'
                }`}
              >
                $
                {profitLoss.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                Timeline:
              </span>
              <span className="font-medium">
                {daysIn} days in, {daysLeft} days left
              </span>
            </div>
          </div>
          <div className="h-[200px] self-end">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financialChartData}
                margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-md p-2 shadow-lg">
                          <p className="text-sm font-bold">
                            {`${payload[0].name}: $${Number(
                              payload[0].value
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                  {financialChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    let isCancelled = false;

    async function loadProjects() {
      // 1) start with local/template projects
      const initial = getInitialProjects();
      if (!isCancelled) {
        setProjects(initial);
      }

      // 2) merge in backend projects
      try {
        const apiProjects: BackendProject[] = await fetchProjects();
        if (isCancelled) return;

        const backendAsProjects: Project[] = apiProjects.map(
          mapBackendProjectToProject
        );

        setProjects((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          return [
            ...prev,
            ...backendAsProjects.filter((p) => !existingIds.has(p.id)),
          ];
        });
      } catch (err) {
        console.error('Failed to load projects from backend:', err);
      } finally {
        if (!isCancelled) {
          setIsMounted(true);
        }
      }
    }

    loadProjects();

    return () => {
      isCancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (isMounted) {
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }, [projects, isMounted]);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [isNewProjectOpen, setIsNewProjectOpen] = React.useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(
    null
  );

  const filteredProjects = projects
    .filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((project) =>
      statusFilter === 'all'
        ? true
        : project.status.toLowerCase() === statusFilter
    );

  const addProject = async (project: Omit<Project, 'id' | 'team'>) => {
    // payload we send to backend – it can store everything, but only some fields are used now
    const payload: BackendProject = {
      id: '', // backend will assign
      name: project.name,
      description: project.description,
      client: project.client,
      streetAddress: project.streetAddress,
      city: project.city,
      zipCode: project.zipCode,
      budget: project.budget,
      finalBid: project.finalBid,
      status: project.status,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      spent: project.spent,
      imageUrl: project.imageUrl,
      imageHint: project.imageHint,
    };

    let backendCreated: BackendProject | null = null;

    try {
      backendCreated = await createProjectApi(payload);
    } catch (err) {
      console.error(
        'Failed to create project via backend, falling back to local only:',
        err
      );
    }

    const idFromBackend = backendCreated?.id ?? Date.now().toString();

    const newProject: Project = {
      ...project,
      id: idFromBackend,
      team: [
        {
          id: 'user1',
          fallback: 'AF',
          imageUrl: 'https://picsum.photos/seed/user1/40',
        },
      ],
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

    setProjects((prev) => [...prev, newProject]);
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setIsEditProjectOpen(true);
  };

  const updateProject = async (
    projectData: Omit<Project, 'id' | 'team'>
  ) => {
    if (!editingProject) return;

    // Build payload for backend
    const payload: Partial<BackendProject> = {
      name: projectData.name,
      description: projectData.description,
      client: projectData.client,
      streetAddress: projectData.streetAddress,
      city: projectData.city,
      zipCode: projectData.zipCode,
      budget: projectData.budget,
      finalBid: projectData.finalBid,
      status: projectData.status,
      progress: projectData.progress,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      spent: projectData.spent,
      imageUrl: projectData.imageUrl,
      imageHint: projectData.imageHint,
    };

    try {
      await updateProjectApi(editingProject.id, payload);
    } catch (err) {
      console.error(
        'Failed to update project in backend, updating UI anyway:',
        err
      );
    }

    // Always keep UI in sync
    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingProject.id
          ? { ...p, ...projectData, team: p.team }
          : p
      )
    );

    setEditingProject(null);
    setIsEditProjectOpen(false);
  };

  const deleteProject = async (id: string) => {
    try {
      await deleteProjectApi(id);
    } catch (err) {
      console.error(
        'Failed to delete project in backend, removing locally anyway:',
        err
      );
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Projects
          </h1>
          <p className="text-muted-foreground">
            Manage all your construction projects from start to finish.
          </p>
        </div>
        <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Fill out the details below to create a new construction project.
              </DialogDescription>
            </DialogHeader>
            <NewProjectForm
              onSubmit={addProject}
              closeDialog={() => setIsNewProjectOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by project name or client..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project, index) => (
          <ProjectCard
            key={project.id ?? `project-${index}`}
            project={project}
            onEdit={handleEditClick}
            onDelete={deleteProject}
          />
        ))}
      </div>

      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the details for this project.
            </DialogDescription>
          </DialogHeader>
          <NewProjectForm
            project={editingProject}
            onSubmit={updateProject}
            closeDialog={() => setIsEditProjectOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewProjectForm({
  project,
  onSubmit,
  closeDialog,
}: {
  project?: Project | null;
  onSubmit: (data: any) => void | Promise<void>;
  closeDialog: () => void;
}) {
  const [name, setName] = React.useState(project?.name || '');
  const [client, setClient] = React.useState(project?.client || '');
  const [streetAddress, setStreetAddress] = React.useState(
    project?.streetAddress || ''
  );
  const [city, setCity] = React.useState(project?.city || '');
  const [zipCode, setZipCode] = React.useState(project?.zipCode || '');
  const [description, setDescription] = React.useState(
    project?.description || ''
  );
  const [budget, setBudget] = React.useState(project?.budget || 0);
  const [finalBid, setFinalBid] = React.useState(project?.finalBid || 0);
  const [status, setStatus] = React.useState<Project['status']>(
    project?.status || 'Planning'
  );
  const [progress, setProgress] = React.useState(project?.progress || 0);
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    project?.startDate ? new Date(project.startDate) : undefined
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    project?.endDate ? new Date(project.endDate) : undefined
  );
  const [image, setImage] = React.useState<string | null>(
    project?.imageUrl || null
  );

  const isEditing = !!project;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      client,
      streetAddress,
      city,
      zipCode,
      description,
      budget,
      finalBid,
      status,
      progress,
      startDate: startDate ? format(startDate, 'MMM d, yyyy') : '',
      endDate: endDate ? format(endDate, 'MMM d, yyyy') : '',
      spent: project?.spent || 0,
      imageUrl:
        image ||
        `https://picsum.photos/seed/project${Math.floor(
          Math.random() * 100
        )}/600/400`,
      imageHint: 'building construction',
    });
    closeDialog();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Riverfront Residences"
        />
      </div>
      <div className="space-y-2">
        <Label>Project Image</Label>
        <div className="flex items-center gap-4">
          <div className="w-32 h-20 border rounded-md flex items-center justify-center bg-muted/50">
            {image ? (
              <Image
                src={image}
                alt="Project preview"
                width={128}
                height={80}
                className="object-cover rounded-md"
              />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <Input
            id="image-upload"
            type="file"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              document.getElementById('image-upload')?.click()
            }
          >
            Choose File
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="client">Client</Label>
        <Input
          id="client"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="e.g., ABC Development Corp"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="streetAddress">Street Address</Label>
        <Input
          id="streetAddress"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          placeholder="e.g., 123 Main St"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Metropolis"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="e.g., 12345"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Project details and scope..."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Internal Contract Amount</Label>
          <Input
            id="budget"
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="finalBid">Final Bid to Customer</Label>
          <Input
            id="finalBid"
            type="number"
            value={finalBid}
            onChange={(e) => setFinalBid(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as Project['status'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="progress">Progress (%)</Label>
          <Input
            id="progress"
            type="number"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
