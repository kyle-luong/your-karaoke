import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { songId, userId } = await request.json();
  const supabase = createAdminClient();

  // Create project
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .insert({ song_id: songId, user_id: userId ?? "00000000-0000-0000-0000-000000000000" })
    .select()
    .single();

  if (projErr) return NextResponse.json({ error: projErr.message }, { status: 500 });

  // Copy original lyrics into a version
  const { data: song } = await supabase.from("songs").select("*").eq("id", songId).single();
  if (song) {
    await supabase.from("versions").insert({
      project_id: project.id,
      type: "original",
      lyrics_text: song.lyrics_raw,
      lrc_data: song.lrc_data,
    });
  }

  return NextResponse.json(project);
}
