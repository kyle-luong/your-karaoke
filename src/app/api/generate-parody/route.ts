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
    let lrcLines: Array<{ timestamp: number; text: string }> | undefined =
      data.lrcLines;
    if (!lrcLines) {
      try {
        const supabase = createAdminClient();
        const { data: song } = await supabase
          .from("songs")
          .select("lrc_data")
          .eq("id", data.songId)
          .single();

        if (song?.lrc_data && Array.isArray(song.lrc_data)) {
          lrcLines = (
            song.lrc_data as Array<{ timeMs: number; line: string }>
          ).map((l) => ({
            timestamp: l.timeMs / 1000,
            text: l.line,
          }));
        }
      } catch {
        console.warn(
          "[generate-parody] Could not fetch lrc_data from DB, proceeding without timing",
        );
      }
    }

    const result = await generateParody(data, lrcLines);

    // Persist as project → version → report so we can reference versionId later
    const supabase = createAdminClient();

    // 1. Create (or reuse) project for this song
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({
        song_id: data.songId,
        user_id: "00000000-0000-0000-0000-000000000000", // anonymous / hackathon
      })
      .select()
      .single();

    if (projErr) {
      console.error(
        "[generate-parody] Project creation failed:",
        projErr.message,
      );
      // Still return the generated lyrics even if DB persistence fails
      return NextResponse.json(result);
    }

    // 2. Create parody version with the generated LRC lines
    const lyricsText = result.parodyLrcLines.map((l) => l.text).join("\n");
    const { data: version, error: verErr } = await supabase
      .from("versions")
      .insert({
        project_id: project.id,
        type: "parody",
        lyrics_text: lyricsText,
        lrc_data: result.parodyLrcLines,
      })
      .select()
      .single();

    if (verErr) {
      console.error(
        "[generate-parody] Version creation failed:",
        verErr.message,
      );
      return NextResponse.json(result);
    }

    // 3. Create report with transformation metadata
    const { error: repErr } = await supabase.from("reports").insert({
      version_id: version.id,
      summary_text: result.summaryNarration,
      transformation_metadata: result.transformationReport,
    });

    if (repErr) {
      console.warn("[generate-parody] Report creation failed:", repErr.message);
    }

    console.log(
      "[generate-parody] Persisted version:",
      version.id,
      "for song:",
      data.songId,
    );

    return NextResponse.json({
      ...result,
      versionId: version.id,
      projectId: project.id,
    });
  } catch (err) {
    console.error("[generate-parody]", err);
    return NextResponse.json(
      { error: "Parody generation failed — try again" },
      { status: 500 },
    );
  }
}
