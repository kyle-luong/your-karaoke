import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const { versionId, hostUserId } = await request.json();
  const supabase = createAdminClient();
  const inviteCode = nanoid(8);

  const { data: party, error } = await supabase
    .from("parties")
    .insert({
      version_id: versionId,
      host_user_id: hostUserId ?? "00000000-0000-0000-0000-000000000000",
      invite_code: inviteCode,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create initial party state
  await supabase.from("party_state").insert({
    party_id: party.id,
    is_playing: false,
    playback_position_ms: 0,
  });

  return NextResponse.json(party);
}
