import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = createAdminClient();

  const { data: party, error } = await supabase
    .from("parties")
    .select("*")
    .eq("invite_code", code)
    .eq("is_active", true)
    .single();

  if (error || !party) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }

  return NextResponse.json(party);
}
