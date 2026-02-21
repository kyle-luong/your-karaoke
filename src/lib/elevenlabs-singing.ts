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

/** A single timed lyric line — mirrors LyricLine from utils/lrc-parser. */
export interface LyricEntry {
  /** Timestamp in seconds. */
  timestamp: number;
  /** Lyric text for this line. */
  text: string;
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
  const response = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
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
  const voiceId = voiceIdOverride ?? process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }
  if (!voiceId) {
    throw new Error("No voiceId provided and ELEVENLABS_VOICE_ID is not set");
  }

  // Process lines sequentially to respect rate limits and keep order.
  const segments: VocalSegment[] = [];

  for (const entry of entries) {
    const audioBuffer = await synthesizeLine(entry.text, voiceId, apiKey);
    segments.push({ entry, audioBuffer });
  }

  return segments;
}
