import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Supabase env in /api/supabase-test =>', {
    url,
    hasAnonKey: !!anon,
  });

  if (!url || !anon) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing Supabase environment variables on the server',
        hasAnonKey: !!anon,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    error: null,
    hasAnonKey: !!anon,
  });
}
