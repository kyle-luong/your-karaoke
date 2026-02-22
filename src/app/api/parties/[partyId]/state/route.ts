import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partyId: string }> }
) {
  const { partyId } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("party_state")
    .update({
      is_playing: body.isPlaying,
      playback_position_ms: body.playbackPositionMs,
      updated_at: new Date().toISOString(),
    })
    .eq("party_id", partyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
