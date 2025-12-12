// src/app/api/team/[id]/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function mapRow(row: any) {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as string,
    email: row.email as string | null,
    phone: row.phone as string | null,
    avatarUrl: row.avatar_url as string | null,
    fallback: row.fallback as string | null,
  };
}

// PUT /api/team/:id  -> update a member
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { id } = params;

  const { name, role, email, phone, avatarUrl, fallback } = body ?? {};

  if (!name || !role) {
    return NextResponse.json(
      { error: 'Name and role are required' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('team_members')
    .update({
      name,
      role,
      email: email ?? null,
      phone: phone ?? null,
      avatar_url: avatarUrl ?? null,
      fallback: fallback ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    console.error('[team PUT] Supabase error', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 },
    );
  }

  return NextResponse.json({ member: mapRow(data) });
}

// DELETE /api/team/:id  -> delete a member
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  const { id } = params;

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[team DELETE] Supabase error', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
