import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const body = await req.json();
  
  // Ensure we have a versionId (the song) and a host
  const { versionId, hostUserId } = body;

  if (!versionId || !hostUserId) {
    return NextResponse.json({ error: "Missing versionId or hostUserId" }, { status: 400 });
  }

  // Create the lobby in the 'parties' table
  const { data, error } = await supabase
    .from("parties")
    .insert({
      version_id: versionId,
      host_user_id: hostUserId,
      invite_code: nanoid(6).toUpperCase(), // Generates a clean 6-char code
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}