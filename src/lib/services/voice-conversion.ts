/**
 * Voice Conversion Service (Replicate + RVC v2)
 *
 * Converts vocals into a different voice using Replicate-hosted RVC models.
 * Used as the "Studio Skin" step in the pipeline:
 *   ElevenLabs TTS → Autotune → **Replicate RVC** → FFmpeg mix
 *
 * Model: zsxkib/realistic-voice-cloning
 * Pricing: ~$0.034/run on Replicate
 */

import Replicate from "replicate";

const MODEL_VERSION =
  "zsxkib/realistic-voice-cloning:0a9c7c558af4c0f20667c1bd1260ce32a2879944a0b9e44e1398660c077b1550" as const;

// ──────── Voice presets ────────
// Built-in RVC options: Squidward, MrKrabs, Plankton, Drake, Vader, Trump, Biden, Obama, Guitar, Voilin, CUSTOM
//
// Parody content → fun cartoon character voices (SpongeBob cast)
// Educational content → Drake (most natural-sounding built-in singer voice)

export type ContentType = "parody" | "educational";

type VoicePreset = {
  readonly name: string;
  readonly genre: string;
  readonly rvcModel: string;
};

const PARODY_PRESETS: Record<string, VoicePreset> = {
  pop: { name: "Squidward", genre: "Pop", rvcModel: "Squidward" },
  hiphop: { name: "MrKrabs", genre: "Hip-Hop/R&B", rvcModel: "MrKrabs" },
  country: { name: "Plankton", genre: "Country/Folk", rvcModel: "Plankton" },
  default: { name: "Squidward", genre: "General", rvcModel: "Squidward" },
};

const EDUCATIONAL_PRESETS: Record<string, VoicePreset> = {
  pop: { name: "Drake", genre: "Pop", rvcModel: "Drake" },
  hiphop: { name: "Drake", genre: "Hip-Hop/R&B", rvcModel: "Drake" },
  country: { name: "Drake", genre: "Country/Folk", rvcModel: "Drake" },
  default: { name: "Drake", genre: "General", rvcModel: "Drake" },
};

/** @deprecated Use pickVoice() instead */
export const VOICE_PRESETS = PARODY_PRESETS;

/** Pick the best voice preset for a genre + content type */
export function pickVoice(
  genre: string,
  contentType: ContentType = "parody",
): VoicePreset {
  const presets = contentType === "educational" ? EDUCATIONAL_PRESETS : PARODY_PRESETS;
  const g = genre.toLowerCase();
  if (g.includes("hip") || g.includes("hop") || g.includes("rap") || g.includes("r&b") || g.includes("rnb")) {
    return presets.hiphop;
  }
  if (g.includes("country") || g.includes("folk")) {
    return presets.country;
  }
  if (g.includes("pop") || g.includes("rock") || g.includes("indie") || g.includes("classic")) {
    return presets.pop;
  }
  return presets.default;
}

/** @deprecated Use pickVoice() instead */
export const pickVoiceForGenre = pickVoice;

export interface VoiceConversionOptions {
  genre?: string;
  contentType?: ContentType;
  pitchShift?: number;
  protect?: number;
  indexRate?: number;
}

function getClient(): Replicate | null {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;
  return new Replicate({ auth: token });
}

/**
 * Convert vocals to a different voice using Replicate RVC.
 * - For parodies: fun character voices (SpongeBob cast)
 * - For educational: natural singer voice (Drake)
 * - If REPLICATE_API_TOKEN is not set, returns input buffer unchanged (demo-friendly)
 */
export async function convertVoice(
  audioBuffer: Buffer,
  options: VoiceConversionOptions = {},
): Promise<Buffer> {
  const client = getClient();
  if (!client) {
    console.warn(
      "[voice-conversion] Missing REPLICATE_API_TOKEN — skipping voice conversion",
    );
    return audioBuffer;
  }

  const preset = pickVoice(options.genre ?? "", options.contentType);
  console.log(`[voice-conversion] Using voice: ${preset.name}`);

  // Replicate expects a data URI or URL for file inputs
  const base64Audio = audioBuffer.toString("base64");
  const dataUri = `data:audio/mpeg;base64,${base64Audio}`;

  const input: Record<string, unknown> = {
    song_input: dataUri,
    rvc_model: preset.rvcModel,
    pitch_change: "no-change",
    index_rate: options.indexRate ?? 0.5,
    filter_radius: 3,
    rms_mix_rate: 0.25,
    pitch_detection_algorithm: "rmvpe",
    crepe_hop_length: 128,
    protect: options.protect ?? 0.33,
    main_vocals_volume_change: 0,
    backup_vocals_volume_change: 0,
    instrumental_volume_change: 0,
    reverb_size: 0.15,
    reverb_wetness: 0.2,
    reverb_dryness: 0.8,
    reverb_damping: 0.7,
    output_format: "mp3",
  };

  console.log("[voice-conversion] Submitting to Replicate...");
  const output = await client.run(MODEL_VERSION, { input });

  // Output is typically a URL string to the converted audio
  const outputUrl =
    typeof output === "string" ? output : (output as Record<string, unknown>)?.output ?? String(output);

  console.log(`[voice-conversion] Downloading result from Replicate...`);
  const response = await fetch(String(outputUrl));
  if (!response.ok) {
    throw new Error(
      `Failed to download Replicate output: ${response.status}`,
    );
  }

  const result = Buffer.from(await response.arrayBuffer());
  console.log(
    `[voice-conversion] Voice conversion complete (${result.length} bytes)`,
  );

  return result;
}
