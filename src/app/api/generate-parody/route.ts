import { NextResponse } from "next/server";
import { generateParodyRequestSchema } from "@/lib/schemas/parody";
import { generateParody } from "@/lib/services/gemini";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = generateParodyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const data = parsed.data;

    // Use client-supplied LRC lines, or fetch from DB
    let lrcLines: Array<{ timestamp: number; text: string }> | undefined = data.lrcLines;
    if (!lrcLines) {
      try {
        const supabase = createAdminClient();
        const { data: song } = await supabase
          .from("songs")
          .select("lrc_data")
          .eq("id", data.songId)
          .single();

        if (song?.lrc_data && Array.isArray(song.lrc_data)) {
          lrcLines = (song.lrc_data as Array<{ timeMs: number; line: string }>).map((l) => ({
            timestamp: l.timeMs / 1000,
            text: l.line,
          }));
        }
      } catch {
        console.warn("[generate-parody] Could not fetch lrc_data from DB, proceeding without timing");
      }
    }

    const result = await generateParody(data, lrcLines);

    // Store parody version if we have a project context
    // TODO: link to project_id from request
    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-parody]", err);
    return NextResponse.json(
      { error: "Parody generation failed — try again" },
      { status: 500 }
    );
  }
}
