/**
 * POST /api/generate-sung-parody
 *
 * Pipeline:
 *   1. Validate request (parodyLrcLines + instrumentalUrl + songId)
 *   2. Read instrumental MP3 (local filesystem or HTTP)
 *   3. Generate vocal segments via ElevenLabs
 *   4. (Optional) Voice conversion via Replicate RVC ("Studio Skin")
 *   5. Mix vocals onto instrumental via ffmpeg
 *   6. Save outputs to local or Supabase storage
 *   7. Return public URLs + metadata
 */

import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { generateVocalSegments } from "@/lib/elevenlabs-singing";
import { mixAudio } from "@/lib/audio-mixer";
import { saveGeneratedFile } from "@/lib/utils/storage";
import { serializeToLrc } from "@/lib/utils/lrc-serializer";
import { lrcLineSchema } from "@/lib/schemas/parody";
import { convertVoice } from "@/lib/services/voice-conversion";

const requestSchema = z.object({
  songId: z.string().min(1),
  parodyLrcLines: z.array(lrcLineSchema).min(1),
  instrumentalUrl: z.string().min(1),
  voiceId: z.string().min(1).optional(),
  useVoiceConversion: z.boolean().optional(),
  songGenre: z.string().optional(),
  contentType: z.enum(["parody", "educational"]).optional(),
});

function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function fetchInstrumental(url: string): Promise<Buffer> {
  if (url.startsWith("/")) {
    const filePath = join(process.cwd(), "public", url);
    return readFile(filePath);
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not fetch instrumental");
  return Buffer.from(await response.arrayBuffer());
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
      "Invalid request: " + parsed.error.issues.map((i) => i.message).join("; "),
      400,
    );
  }

  const { songId, parodyLrcLines, instrumentalUrl, voiceId, useVoiceConversion, songGenre, contentType } = parsed.data;

  // 1. Read instrumental
  let instrumentalBuffer: Buffer;
  try {
    instrumentalBuffer = await fetchInstrumental(instrumentalUrl);
  } catch {
    return errorJson("Failed to fetch instrumental audio", 400);
  }

  // 2. Generate vocal segments via ElevenLabs
  let segments;
  try {
    segments = await generateVocalSegments(parodyLrcLines, voiceId);
  } catch (err) {
    console.error("[generate-sung-parody] ElevenLabs error:", err);
    return errorJson("Voice generation failed", 502);
  }

  // 3. (Optional) Replicate RVC voice conversion on vocal segments
  if (useVoiceConversion) {
    try {
      for (let i = 0; i < segments.length; i++) {
        segments[i].audioBuffer = await convertVoice(segments[i].audioBuffer, {
          genre: songGenre,
          contentType,
        });
      }
    } catch (err) {
      console.error("[generate-sung-parody] Voice conversion error:", err);
      // Continue with unconverted vocals rather than failing the whole pipeline
    }
  }

  // 4. Mix vocals onto instrumental
  let mixedMp3: Buffer;
  let vocalsMp3: Buffer;
  let instrumentalMp3: Buffer;
  let durationMs: number;
  try {
    const result = await mixAudio(instrumentalBuffer, segments);
    mixedMp3 = result.mixedMp3;
    vocalsMp3 = result.vocalsMp3;
    instrumentalMp3 = result.instrumentalMp3;
    durationMs = result.durationMs;
  } catch (err) {
    console.error("[generate-sung-parody] Audio mixing error:", err);
    return errorJson("Audio processing failed", 500);
  }

  // 5. Save outputs
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
}
