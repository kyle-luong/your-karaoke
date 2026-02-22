/**
 * POST /api/generate-audio
 *
 * Thin wrapper that accepts a { versionId } and orchestrates the
 * sung-parody pipeline for that specific version.
 *
 * Steps:
 *   1. Look up version → project → song in Supabase
 *   2. Derive instrumental URL from song title
 *   3. Run ElevenLabs vocal generation + ffmpeg mixing
 *   4. Persist the MP3 and update the version's report with the audio URL
 *   5. Return { url } to the caller
 */

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateVocalSegments } from "@/lib/elevenlabs-singing";
import { convertVoice } from "@/lib/services/voice-conversion";
import { mixAudio } from "@/lib/audio-mixer";
import { saveGeneratedFile } from "@/lib/utils/storage";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Derive the conventional instrumental path from a song title. */
function instrumentalUrlFromTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `/demo/instrumentals/${slug}-instrumental.mp3`;
}

/** Read an instrumental file – supports local /public paths and HTTP URLs. */
async function fetchInstrumental(url: string): Promise<Buffer> {
  if (url.startsWith("/")) {
    const filePath = join(process.cwd(), "public", url);
    console.log("[generate-audio] Reading instrumental from disk:", filePath);
    return readFile(filePath);
  }
  console.log("[generate-audio] Fetching instrumental from URL:", url);
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Instrumental fetch failed (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  console.log("[generate-audio] ▶ Request received");

  // --- Parse body ---
  let body: { versionId?: string };
  try {
    body = await request.json();
  } catch {
    return errorJson("Invalid JSON body", 400);
  }

  const { versionId } = body;
  if (!versionId || typeof versionId !== "string") {
    console.error("[generate-audio] Missing or invalid versionId");
    return errorJson("versionId is required", 400);
  }
  console.log("[generate-audio] versionId:", versionId);

  const supabase = createAdminClient();

  // --- 1. Fetch version ---
  const { data: version, error: versionErr } = await supabase
    .from("versions")
    .select("id, project_id, lrc_data, type")
    .eq("id", versionId)
    .single();

  if (versionErr || !version) {
    console.error(
      "[generate-audio] Version lookup failed:",
      versionErr?.message,
    );
    return errorJson("Version not found", 404);
  }
  console.log(
    "[generate-audio] Version found — project_id:",
    version.project_id,
    "type:",
    version.type,
  );

  // --- 2. Fetch project → song_id ---
  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("song_id")
    .eq("id", version.project_id)
    .single();

  if (projectErr || !project) {
    console.error(
      "[generate-audio] Project lookup failed:",
      projectErr?.message,
    );
    return errorJson("Project not found", 404);
  }
  console.log("[generate-audio] song_id:", project.song_id);

  // --- 3. Fetch song ---
  const { data: song, error: songErr } = await supabase
    .from("songs")
    .select("id, title, genre")
    .eq("id", project.song_id)
    .single();

  if (songErr || !song) {
    console.error("[generate-audio] Song lookup failed:", songErr?.message);
    return errorJson("Song not found", 404);
  }
  console.log("[generate-audio] Song title:", song.title);

  // --- 4. Prepare LRC lines ---
  const rawLrc = version.lrc_data as unknown;
  if (!Array.isArray(rawLrc) || rawLrc.length === 0) {
    console.error("[generate-audio] Version has no LRC data");
    return errorJson("Version has no LRC timing data", 400);
  }

  // Normalise to { timeMs, line } — DB may store as { timeMs, line } or legacy { timestamp, text }
  const parodyLrcLines: Array<{ timeMs: number; line: string }> = rawLrc.map(
    (entry: Record<string, unknown>) => {
      if (typeof entry.timeMs === "number" && typeof entry.line === "string") {
        return { timeMs: entry.timeMs, line: entry.line };
      }
      if (
        typeof entry.timestamp === "number" &&
        typeof entry.text === "string"
      ) {
        return { timeMs: Math.round(entry.timestamp * 1000), line: entry.text };
      }
      // Best-effort fallback
      return {
        timeMs: Math.round(
          Number(entry.timeMs ?? Number(entry.timestamp ?? 0) * 1000),
        ),
        line: String(entry.line ?? entry.text ?? ""),
      };
    },
  );
  console.log(
    "[generate-audio] LRC lines count:",
    parodyLrcLines.length,
    "— first:",
    parodyLrcLines[0],
  );

  // --- 5. Read instrumental ---
  const instrumentalUrl = instrumentalUrlFromTitle(song.title);
  console.log("[generate-audio] Derived instrumental URL:", instrumentalUrl);

  let instrumentalBuffer: Buffer;
  try {
    instrumentalBuffer = await fetchInstrumental(instrumentalUrl);
    console.log(
      "[generate-audio] Instrumental loaded — bytes:",
      instrumentalBuffer.length,
    );
  } catch (err) {
    console.error("[generate-audio] Failed to load instrumental:", err);
    return errorJson(`Could not load instrumental for "${song.title}"`, 400);
  }

  // --- 6. Generate vocal segments via ElevenLabs ---
  let segments;
  try {
    console.log(
      "[generate-audio] Calling ElevenLabs TTS for",
      parodyLrcLines.length,
      "lines...",
    );
    segments = await generateVocalSegments(parodyLrcLines);
    console.log(
      "[generate-audio] ElevenLabs returned",
      segments.length,
      "segments",
    );
  } catch (err) {
    console.error("[generate-audio] ElevenLabs error:", err);
    return errorJson("Voice generation failed", 502);
  }

  // --- 7. Mix vocals (first pass — to get combined vocals track) ---
  let mixedMp3: Buffer;
  let vocalsMp3: Buffer;
  let durationMs: number;
  try {
    console.log("[generate-audio] Mixing vocals...");
    const result = await mixAudio(instrumentalBuffer, segments);
    mixedMp3 = result.mixedMp3;
    vocalsMp3 = result.vocalsMp3;
    durationMs = result.durationMs;
    console.log(
      "[generate-audio] Initial mix complete — duration:",
      durationMs,
      "ms",
    );
  } catch (err) {
    console.error("[generate-audio] Audio mixing error:", err);
    return errorJson("Audio processing failed", 500);
  }

  // --- 8. Voice conversion via Replicate RVC (single call on combined vocals) ---
  try {
    const contentType = version.type === "parody" ? "parody" : "educational";
    console.log(
      "[generate-audio] Running RVC voice conversion on combined vocals...",
    );
    const convertedVocals = await convertVoice(vocalsMp3, {
      genre: song.genre ?? "",
      contentType,
    });

    // Re-mix converted vocals with instrumental
    if (convertedVocals !== vocalsMp3) {
      console.log(
        "[generate-audio] Re-mixing converted vocals with instrumental...",
      );
      const reMix = await mixAudio(instrumentalBuffer, [
        {
          entry: { timeMs: 0, line: "" },
          audioBuffer: convertedVocals,
        },
      ]);
      mixedMp3 = reMix.mixedMp3;
      durationMs = reMix.durationMs;
      console.log("[generate-audio] Voice conversion + re-mix complete");
    }
  } catch (err) {
    console.warn(
      "[generate-audio] Voice conversion failed (using TTS vocals):",
      err,
    );
  }

  // --- 9. Save MP3 ---
  let mp3Url: string;
  try {
    mp3Url = await saveGeneratedFile(
      song.id,
      `remix-${versionId}.mp3`,
      mixedMp3,
    );
    console.log("[generate-audio] Saved MP3 at:", mp3Url);
  } catch (err) {
    console.error("[generate-audio] Storage error:", err);
    return errorJson("Failed to save generated audio", 500);
  }

  // --- 10. Update the report's narration_audio_url so the UI can play it later ---
  try {
    const { error: updateErr } = await supabase
      .from("reports")
      .update({ narration_audio_url: mp3Url })
      .eq("version_id", versionId);

    if (updateErr) {
      console.warn(
        "[generate-audio] Could not update report audio URL:",
        updateErr.message,
      );
    } else {
      console.log(
        "[generate-audio] Updated report narration_audio_url for version",
        versionId,
      );
    }
  } catch (err) {
    // Non-fatal — the file is already saved
    console.warn("[generate-audio] Report update failed (non-fatal):", err);
  }

  console.log("[generate-audio] ✅ Done — returning URL:", mp3Url);
  return NextResponse.json({ url: mp3Url, durationMs });
}
