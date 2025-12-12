// src/app/api/team/route.ts
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

// GET /api/team  -> list all team members
export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[team GET] Supabase error', error);
    return NextResponse.json(
      { error: 'Failed to load team members' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    team: (data ?? []).map(mapRow),
  });
}

// POST /api/team  -> create a new member
export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();

  const { name, role, email, phone, avatarUrl, fallback } = body ?? {};

  if (!name || !role) {
    return NextResponse.json(
      { error: 'Name and role are required' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      name,
      role,
      email: email ?? null,
      phone: phone ?? null,
      avatar_url: avatarUrl ?? null,
      fallback: fallback ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('[team POST] Supabase error', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 },
    );
  }

  return NextResponse.json({ member: mapRow(data) });
}
