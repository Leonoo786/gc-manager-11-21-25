// src/app/api/snapshot/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// -----------------------
// GET  /api/snapshot
// -----------------------
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Always take the most recent snapshot row
    const { data, error } = await supabase
      .from('snapshots')
      .select('payload, budget_categories, vendors, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[snapshot GET] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to load snapshot from Supabase.' },
        { status: 500 },
      );
    }

    if (!data || !data.payload) {
      return NextResponse.json(
        { error: 'No snapshot row found.' },
        { status: 404 },
      );
    }

    let payloadJson: any;
    try {
      // If payload is jsonb, Supabase SDK already gives us an object.
      payloadJson =
        typeof data.payload === 'string'
          ? JSON.parse(data.payload)
          : data.payload;
    } catch (e) {
      console.error('[snapshot GET] Failed to parse payload JSON:', e);
      return NextResponse.json(
        { error: 'Snapshot payload is invalid JSON.' },
        { status: 500 },
      );
    }

    if (!payloadJson.projects || !Array.isArray(payloadJson.projects)) {
      return NextResponse.json(
        { error: 'Snapshot payload has no valid projects array.' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        projects: payloadJson.projects,
        savedAt: payloadJson.savedAt,
        budgetCategories: data.budget_categories ?? null,
        vendors: data.vendors ?? null,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[snapshot GET] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error loading snapshot.' },
      { status: 500 },
    );
  }
}

// -----------------------
// POST  /api/snapshot
// -----------------------
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();

    const body = await req.json();
    const projects = body?.projects ?? [];
    const budgetCategories = body?.budgetCategories ?? null;
    const vendors = body?.vendors ?? null;

    const payload = {
      projects,
      savedAt: new Date().toISOString(),
    };

    // Insert a NEW row each time; "latest snapshot" is the one with the max created_at
    const { error } = await supabase.from('snapshots').insert([
      {
        payload,
        budget_categories: budgetCategories,
        vendors,
      },
    ]);

    if (error) {
      console.error('[snapshot POST] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save snapshot to Supabase.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, message: 'Snapshot saved successfully.' },
      { status: 200 },
    );
  } catch (err) {
    console.error('[snapshot POST] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error saving snapshot.' },
      { status: 500 },
    );
  }
}
