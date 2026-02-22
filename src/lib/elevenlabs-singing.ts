/**
 * ElevenLabs singing / TTS service for the sung-parody pipeline.
 *
 * Converts each LRC line into a separate audio segment via
 * ElevenLabs text-to-speech, then returns the raw audio buffers
 * so the caller can stitch & mix them with the instrumental.
 *
 * This module does NOT write to storage or a database.
 */

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";
/** Premade voice that works on ElevenLabs free tier (Charlie - Deep, Confident, Energetic) */
const PREMADE_FALLBACK_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

/** A single timed lyric line — mirrors LyricLine from utils/lrc-parser. */
export interface LyricEntry {
  /** Time in milliseconds from track start. */
  timeMs: number;
  /** Lyric text for this line. */
  line: string;
}

export interface VocalSegment {
  /** The lyric entry this audio corresponds to. */
  entry: LyricEntry;
  /** Raw MP3 bytes for this line. */
  audioBuffer: Buffer;
}

/**
 * Generate a TTS audio buffer for a single line of lyrics.
 */
async function synthesizeLine(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<Buffer> {
  // Use the streaming endpoint with eleven_flash_v2_5 — works on free tier
  const response = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_flash_v2_5",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(
      `[elevenlabs] API error ${response.status} (voice: ${voiceId}):`,
      errorBody,
    );
    // 402 with "paid_plan_required" means the voice is a library voice not usable on free tier
    // Retry with the premade fallback voice
    if (response.status === 402 && voiceId !== PREMADE_FALLBACK_VOICE_ID) {
      console.warn(
        `[elevenlabs] Voice ${voiceId} requires paid plan — falling back to premade voice`,
      );
      return synthesizeLine(text, PREMADE_FALLBACK_VOICE_ID, apiKey);
    }
    if (response.status === 402) {
      throw new Error(`ElevenLabs quota exceeded: ${errorBody}`);
    }
    throw new Error(`ElevenLabs API error: ${response.status} — ${errorBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate vocal audio for every LRC entry.
 *
 * Each entry becomes one TTS call.  The returned segments preserve the
 * original order and timing metadata so the mixer can place them correctly.
 *
 * @throws {Error} if ElevenLabs is unreachable or returns an error.
 */
export async function generateVocalSegments(
  entries: LyricEntry[],
  voiceIdOverride?: string,
): Promise<VocalSegment[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  // Always use premade voice on free tier — library voices require paid plan
  const voiceId = voiceIdOverride ?? PREMADE_FALLBACK_VOICE_ID;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }
  if (!voiceId) {
    throw new Error("No voiceId provided and ELEVENLABS_VOICE_ID is not set");
  }

  // Process lines sequentially to respect rate limits and keep order.
  const segments: VocalSegment[] = [];

  for (const entry of entries) {
    const audioBuffer = await synthesizeLine(entry.line, voiceId, apiKey);
    segments.push({ entry, audioBuffer });
  }

  return segments;
}
