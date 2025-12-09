import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase-server";

// POST /api/snapshot
// Body: { projects: Project[] }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projects = body?.projects;

    if (!Array.isArray(projects)) {
      return NextResponse.json(
        { error: "Invalid payload: projects must be an array" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServerClient
      .from("project_snapshots")
      .insert([{ projects }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save snapshot" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Snapshot saved",
        snapshot: data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/snapshot error:", err);
    return NextResponse.json(
      { error: "Unexpected error saving snapshot" },
      { status: 500 }
    );
  }
}

// GET /api/snapshot
// Returns the latest snapshot
export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from("project_snapshots")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json(
        { error: "Failed to load snapshot" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "No snapshots found", snapshot: null },
        { status: 200 }
      );
    }

    const latest = data[0];

    return NextResponse.json(
      {
        message: "Loaded latest snapshot",
        snapshot: latest,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/snapshot error:", err);
    return NextResponse.json(
      { error: "Unexpected error loading snapshot" },
      { status: 500 }
    );
  }
}
