/**
 * POST /api/generate-sung-parody
 *
 * Pure processing pipeline:
 *   1. Validate request (zod)
 *   2. Fetch & validate instrumental MP3
 *   3. Parse & validate LRC lyrics
 *   4. Generate vocal segments via ElevenLabs
 *   5. Mix vocals onto instrumental via ffmpeg
 *   6. Upload results to Supabase Storage
 *   7. Return public URLs + metadata
 *
 * No UI, no database writes, no auth, no retry loops.
 */

import { NextResponse } from "next/server";
import { z } from "zod/v4";
import parseLrcContent from "@/lib/utils/lrc-parser";
import { generateVocalSegments } from "@/lib/elevenlabs-singing";
import { mixAudio } from "@/lib/audio-mixer";

/** Maximum allowed size for the instrumental MP3 (10 MB). */
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const requestSchema = z.object({
  instrumentalUrl: z.url(),
  lrcLyrics: z.string().min(1),
  voiceId: z.string().min(1).optional(),
});

/** Structured error helper — never leaks raw exception text. */
function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson("Invalid JSON body", 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson(
      "Invalid request: " +
        parsed.error.issues.map((i) => i.message).join("; "),
      400,
    );
  }

  const { instrumentalUrl, lrcLyrics, voiceId } = parsed.data;

  let instrumentalBuffer: Buffer;
  try {
    const audioResponse = await fetch(instrumentalUrl);
    if (!audioResponse.ok) {
      return errorJson("Could not fetch instrumental audio", 400);
    }

    const contentType = audioResponse.headers.get("content-type") ?? "";
    if (!contentType.includes("audio/mpeg")) {
      return errorJson("Invalid audio format — expected audio/mpeg", 400);
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_AUDIO_BYTES) {
      return errorJson("Audio file exceeds 10 MB limit", 400);
    }

    instrumentalBuffer = Buffer.from(arrayBuffer);
  } catch {
    return errorJson("Failed to fetch instrumental audio", 400);
  }

  const lrcEntries = parseLrcContent(lrcLyrics);
  if (lrcEntries.length === 0) {
    return errorJson("Invalid or empty LRC lyrics", 400);
  }

  let segments;
  try {
    segments = await generateVocalSegments(lrcEntries, voiceId);
  } catch (err) {
    console.error("[generate-sung-parody] ElevenLabs error:", err);
    return errorJson("Voice generation failed", 502);
  }

  let mixedMp3: Buffer;
  let durationMs: number;
  try {
    const result = await mixAudio(instrumentalBuffer, segments);
    mixedMp3 = result.mixedMp3;
    durationMs = result.durationMs;
  } catch (err) {
    console.error("[generate-sung-parody] Audio mixing error:", err);
    return errorJson("Audio processing failed", 500);
  }

  const base64Mp3 = mixedMp3.toString("base64");
  const generatedMp3DataUrl = `data:audio/mpeg;base64,${base64Mp3}`;

  return NextResponse.json({
    generatedMp3Url: generatedMp3DataUrl,
    generatedLrc: lrcLyrics,
    durationMs,
  });
}
