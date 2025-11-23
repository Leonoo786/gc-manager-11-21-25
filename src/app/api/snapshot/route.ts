import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TABLE_NAME = 'snapshots';

function getSupabaseAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Safety: strip /rest/v1 if it ever appears
  const url = rawUrl ? rawUrl.replace(/\/rest\/v1\/?$/, '') : undefined;

  if (!url || !serviceKey) {
    throw new Error(
      `Supabase env vars missing. url: ${url}, hasServiceKey: ${!!serviceKey}, hasAnonKey: ${!!anonKey}`
    );
  }

  // Use service role key on the server so we can insert freely
  return createClient(url, serviceKey);
}

// ---------- GET: fetch latest snapshots ----------
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        count: data?.length ?? 0,
        data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Unknown error in GET /api/snapshot' },
      { status: 500 }
    );
  }
}

// ---------- POST: save a new snapshot ----------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.payload) {
      return NextResponse.json(
        { ok: false, error: 'Missing payload in request body' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        payload: body.payload,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        snapshotId: data.id,
        created_at: data.created_at,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Unknown error in POST /api/snapshot' },
      { status: 500 }
    );
  }
}
