'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getSupabaseClient } from '@/lib/supabase-client';


export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatarUrl: string;
  fallback: string;
};

const STORAGE_KEY = 'gc.team.members.v1';

function initials(name: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function uploadAvatarToSupabase(file: File) {
  const supabaseClient = getSupabaseClient();
  // You can change bucket name if you prefer.
  const bucket = 'avatars';

  const ext = file.name.split('.').pop() || 'png';
  const path = `team/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/*',
    });

  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Failed to get public URL');

  return data.publicUrl;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });

  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Load from localStorage (dynamic persistence)
  React.useEffect(() => {
    const stored = safeJsonParse<TeamMember[]>(
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
      [],
    );
    setTeamMembers(stored);
  }, []);

  // Persist to localStorage
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teamMembers));
  }, [teamMembers]);

  const openAdd = () => {
    setEditingId(null);
    setUploadError(null);
    setForm({ name: '', role: '', email: '', phone: '', avatarUrl: '' });
    setDialogOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setUploadError(null);
    setForm({
      name: m.name,
      role: m.role,
      email: m.email,
      phone: m.phone,
      avatarUrl: m.avatarUrl,
    });
    setDialogOpen(true);
  };

  const deleteMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const saveMember = () => {
    const name = form.name.trim();
    if (!name) return;

    const nextMember: TeamMember = {
      id: editingId ?? `team-${Date.now()}`,
      name,
      role: form.role.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      avatarUrl: form.avatarUrl.trim(),
      fallback: initials(name),
    };

    setTeamMembers((prev) => {
      if (editingId) return prev.map((m) => (m.id === editingId ? nextMember : m));
      return [nextMember, ...prev];
    });

    setDialogOpen(false);
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadAvatarToSupabase(file);
      setForm((f) => ({ ...f, avatarUrl: url }));
    } catch (e: any) {
      setUploadError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Team</CardTitle>
          <Button onClick={openAdd}>+ Add Member</Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    No team members yet.
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-none">
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
                      <div className="inline-flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMember(member.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Member' : 'Add Member'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Preview */}
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Avatar className="h-12 w-12 rounded-none">
                <AvatarImage src={form.avatarUrl} />
                <AvatarFallback>{initials(form.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium">{form.name || 'Preview'}</div>
                <div className="text-xs text-muted-foreground">
                  {form.avatarUrl ? 'Using uploaded image URL' : 'Upload an image or paste a URL'}
                </div>
              </div>
            </div>

            {/* Upload */}
            <div className="grid gap-2">
              <Label>Avatar</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById('team-avatar-file')?.click()}
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Button>

                <input
                  id="team-avatar-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />

                <Input
                  placeholder="...or paste an image URL"
                  value={form.avatarUrl}
                  onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                />
              </div>

              {uploadError && (
                <div className="text-sm text-red-600">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Role</Label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveMember}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
