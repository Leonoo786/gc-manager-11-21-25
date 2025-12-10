// src/app/api/snapshot/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// We store everything for this app in a single row with a fixed UUID
// This must be a valid UUID string
const SNAPSHOT_ROW_ID = '00000000-0000-0000-0000-000000000001';


type SnapshotBody = {
  projects: unknown;
  budgetCategories?: unknown;
  vendors?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SnapshotBody;

    const supabase = getSupabaseAdmin();

    // Put *everything* into payload so we only need that one column
    const payload = {
      projects: body.projects,
      budgetCategories: body.budgetCategories ?? null,
      vendors: body.vendors ?? null,
      savedAt: new Date().toISOString(),
    };

    const { error } = await supabase
  .from('snapshots')
  .upsert(
    {
      id: SNAPSHOT_ROW_ID,
      payload,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'id', // ensure we overwrite the same row
    },
  );


    if (error) {
      console.error('[snapshot POST] Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[snapshot POST] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
  .from('snapshots')
  .select('payload')
  .eq('id', SNAPSHOT_ROW_ID)
  .single();


    if (error) {
      console.error('[snapshot GET] Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    if (!data || !data.payload) {
      return NextResponse.json(
        { success: false, error: 'No snapshot found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      payload: data.payload,
    });
  } catch (err) {
    console.error('[snapshot GET] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 },
    );
  }
}
