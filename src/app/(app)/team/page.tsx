'use client';

import * as React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { teamMembers as initialTeamMembers, TeamMember } from './team-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, MoreHorizontal, Upload } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>(initialTeamMembers);
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null);

  const addMember = (member: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
        ...member,
        id: teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.id)) + 1 : 1,
    };
    setTeamMembers(prev => [...prev, newMember]);
    setIsAddMemberOpen(false);
  };

  const handleEditClick = (member: TeamMember) => {
    setEditingMember(member);
    setIsEditMemberOpen(true);
  };
  
  const handleUpdateMember = (updatedData: Omit<TeamMember, 'id'>) => {
    if (!editingMember) return;
    setTeamMembers(teamMembers.map(m => m.id === editingMember.id ? { ...m, ...updatedData } : m));
    setEditingMember(null);
  };

  const deleteMember = (id: number) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline tracking-tight">
            Team Members
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage all internal team members.
          </p>
        </div>
         <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
                 <Button>
                    <UserPlus className="mr-2" />
                    New Member
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Team Member</DialogTitle>
                    <DialogDescription>Add a new member to your team.</DialogDescription>
                </DialogHeader>
                <MemberForm onSubmit={addMember} closeDialog={() => setIsAddMemberOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>All Team Members</CardTitle>
            <CardDescription>A list of all internal team members in your organization.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-end mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search projects..." 
                    className="pl-10" 
                  />
                </div>
            </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatarUrl} data-ai-hint="person face" />
                        <AvatarFallback>{member.fallback}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEditClick(member)}>Edit</DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this team member.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMember(member.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Edit Dialog */}
      <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Edit Team Member</DialogTitle>
                  <DialogDescription>Update the details for this team member.</DialogDescription>
              </DialogHeader>
              <MemberForm 
                  member={editingMember}
                  onSubmit={handleUpdateMember}
                  closeDialog={() => setIsEditMemberOpen(false)}
              />
          </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberForm({
    member,
    onSubmit,
    closeDialog,
  }: {
    member?: TeamMember | null;
    onSubmit: (data: Omit<TeamMember, 'id'>) => void;
    closeDialog: () => void;
  }) {
    const [name, setName] = React.useState(member?.name || '');
    const [email, setEmail] = React.useState(member?.email || '');
    const [phone, setPhone] = React.useState(member?.phone || '');
    const [role, setRole] = React.useState(member?.role || '');
    const [avatar, setAvatar] = React.useState<string | null>(member?.avatarUrl || null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            }
            reader.readAsDataURL(file);
        }
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fallback = name.split(' ').map(n => n[0]).join('').toUpperCase();
        onSubmit({
            name,
            email,
            phone,
            role,
            avatarUrl: avatar || `https://picsum.photos/seed/${name.replace(/\s/g, '')}/128/128`,
            fallback,
        });
        closeDialog();
    };

    React.useEffect(() => {
        if (member) {
            setName(member.name);
            setEmail(member.email);
            setPhone(member.phone);
            setRole(member.role);
            setAvatar(member.avatarUrl);
        }
    }, [member]);


    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label>Avatar</Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            {avatar ? <AvatarImage src={avatar} data-ai-hint="person face" /> : <AvatarFallback><UserPlus className="h-8 w-8 text-muted-foreground" /></AvatarFallback>}
                        </Avatar>
                        <div className='flex-1'>
                            <Input id="avatar-upload" type="file" onChange={handleAvatarChange} className="hidden" />
                             <Button type="button" variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Photo
                            </Button>
                             <p className="text-xs text-muted-foreground mt-2">Upload a photo for the team member.</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., John Doe" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., Project Manager" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g., john.d@company.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g., 555-123-4567" />
                </div>
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
