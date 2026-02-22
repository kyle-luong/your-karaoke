/**
 * POST /api/generate-sung-parody
 *
<<<<<<< HEAD
 * Pipeline:
 *   1. Validate request (parodyLrcLines + instrumentalUrl + songId)
 *   2. Read instrumental MP3 (local filesystem or HTTP)
 *   3. Generate vocal segments via ElevenLabs
 *   4. Mix vocals onto instrumental via ffmpeg
 *   5. Save outputs to local or Supabase storage
 *   6. Return public URLs + metadata
=======
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
>>>>>>> pratik
 */

import { NextResponse } from "next/server";
import { z } from "zod/v4";
<<<<<<< HEAD
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { generateVocalSegments } from "@/lib/elevenlabs-singing";
import { mixAudio } from "@/lib/audio-mixer";
import { saveGeneratedFile } from "@/lib/utils/storage";
import { serializeToLrc } from "@/lib/utils/lrc-serializer";
import { lrcLineSchema } from "@/lib/schemas/parody";

const requestSchema = z.object({
  songId: z.string().min(1),
  parodyLrcLines: z.array(lrcLineSchema).min(1),
  instrumentalUrl: z.string().min(1),
  voiceId: z.string().min(1).optional(),
});

=======
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
>>>>>>> pratik
function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

<<<<<<< HEAD
async function fetchInstrumental(url: string): Promise<Buffer> {
  if (url.startsWith("/")) {
    const filePath = join(process.cwd(), "public", url);
    return readFile(filePath);
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not fetch instrumental");
  return Buffer.from(await response.arrayBuffer());
}

=======
>>>>>>> pratik
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
<<<<<<< HEAD
      "Invalid request: " + parsed.error.issues.map((i) => i.message).join("; "),
=======
      "Invalid request: " +
        parsed.error.issues.map((i) => i.message).join("; "),
>>>>>>> pratik
      400,
    );
  }

<<<<<<< HEAD
  const { songId, parodyLrcLines, instrumentalUrl, voiceId } = parsed.data;

  // 1. Read instrumental
  let instrumentalBuffer: Buffer;
  try {
    instrumentalBuffer = await fetchInstrumental(instrumentalUrl);
=======
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
>>>>>>> pratik
  } catch {
    return errorJson("Failed to fetch instrumental audio", 400);
  }

<<<<<<< HEAD
  // 2. Generate vocal segments via ElevenLabs
  let segments;
  try {
    segments = await generateVocalSegments(parodyLrcLines, voiceId);
=======
  const lrcEntries = parseLrcContent(lrcLyrics);
  if (lrcEntries.length === 0) {
    return errorJson("Invalid or empty LRC lyrics", 400);
  }

  let segments;
  try {
    segments = await generateVocalSegments(lrcEntries, voiceId);
>>>>>>> pratik
  } catch (err) {
    console.error("[generate-sung-parody] ElevenLabs error:", err);
    return errorJson("Voice generation failed", 502);
  }

<<<<<<< HEAD
  // 3. Mix vocals onto instrumental
  let mixedMp3: Buffer;
  let vocalsMp3: Buffer;
  let instrumentalMp3: Buffer;
=======
  let mixedMp3: Buffer;
>>>>>>> pratik
  let durationMs: number;
  try {
    const result = await mixAudio(instrumentalBuffer, segments);
    mixedMp3 = result.mixedMp3;
<<<<<<< HEAD
    vocalsMp3 = result.vocalsMp3;
    instrumentalMp3 = result.instrumentalMp3;
=======
>>>>>>> pratik
    durationMs = result.durationMs;
  } catch (err) {
    console.error("[generate-sung-parody] Audio mixing error:", err);
    return errorJson("Audio processing failed", 500);
  }

<<<<<<< HEAD
  // 4. Save outputs
  try {
    const mp3Url = await saveGeneratedFile(songId, "sung-parody.mp3", mixedMp3);
    const vocalsUrl = await saveGeneratedFile(songId, "vocals.mp3", vocalsMp3);
    const instrumentalOutUrl = await saveGeneratedFile(songId, "instrumental.mp3", instrumentalMp3);
    const lrcText = serializeToLrc(parodyLrcLines);
    const lrcUrl = await saveGeneratedFile(songId, "parody.lrc", lrcText);

    return NextResponse.json({
      mp3Url,
      vocalsUrl,
      instrumentalUrl: instrumentalOutUrl,
      lrcUrl,
      parodyLrcLines,
      durationMs,
    });
  } catch (err) {
    console.error("[generate-sung-parody] Storage error:", err);
    return errorJson("Failed to save generated files", 500);
  }
=======
  const base64Mp3 = mixedMp3.toString("base64");
  const generatedMp3DataUrl = `data:audio/mpeg;base64,${base64Mp3}`;

  return NextResponse.json({
    generatedMp3Url: generatedMp3DataUrl,
    generatedLrc: lrcLyrics,
    durationMs,
  });
>>>>>>> pratik
}
