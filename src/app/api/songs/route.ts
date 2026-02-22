import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/songs
 *
 * Returns every song in the database, sorted alphabetically by title.
 * This endpoint is public (no auth) — handy for client‑side refetching
 * without a full page reload.
 */
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("title");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
