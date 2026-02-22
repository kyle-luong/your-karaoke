#!/usr/bin/env tsx
/**
 * End-to-end pipeline: Generate a parody of a song (customizable via SONG_SLUG)
 * with Gemini lyrics + ElevenLabs TTS vocals + ffmpeg mixing + EXTREME AUTOTUNE.
 *
 * Usage:
 *   npx tsx --env-file .env scripts/run-pipeline.ts
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  mkdtempSync,
} from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { GoogleGenAI } from "@google/genai";
import {
  convertVoice,
  pickVoiceForGenre,
} from "../src/lib/services/voice-conversion";

// ──────── Config ────────
const SONG_SLUG = "mo-bamba"; // The song to test
const IS_KIDS_MODE = true;
const THEME = "pizza and fast food obsession";
const TONE = "dramatic";
const SONG_GENRE = "hip-hop";
const MAX_TIMESTAMP_SEC = 999; // Full song
const USE_PRO_AUTOTUNE = true;
const AUTOTUNE_STRENGTH = 1.0;
const USE_VOICE_CONVERSION = true; // Replicate RVC voice conversion

const LRC_PATH = join(process.cwd(), `public/demo/lrcs/${SONG_SLUG}.txt`);
const INSTRUMENTAL_PATH = join(
  process.cwd(),
  `public/demo/instrumentals/${SONG_SLUG}-instrumental.mp3`,
);
const OUTPUT_DIR = join(
  process.cwd(),
  `public/generated/${SONG_SLUG}-parody-final`,
);

// ──────── LRC Parser ────────
function parseLrc(content: string) {
  return content
    .split("\n")
    .map((line) => {
      const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (!match) return null;
      const timestampSeconds =
        parseInt(match[1], 10) * 60 + parseFloat(match[2]);
      const timeMs = Math.round(timestampSeconds * 1000);
      const text = match[3].trim();
      return text ? { timeMs, line: text } : null;
    })
    .filter(Boolean) as Array<{ timeMs: number; line: string }>;
}

// ──────── ElevenLabs TTS ────────
async function synthesizeLine(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5",
        voice_settings: { stability: 0.3, similarity_boost: 0.8 },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${errText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

// ──────── Main Pipeline ────────
async function main() {
  console.log(`🎵 Starting Pipeline for: ${SONG_SLUG.toUpperCase()}`);
  console.log(`🛡️  Kids Mode: ${IS_KIDS_MODE ? "ON" : "OFF"}`);
  console.log(`🦆 Theme: ${THEME}\n`);

  const geminiKey = process.env.GEMINI_API_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  if (!geminiKey || !elevenLabsKey) {
    throw new Error("Missing GEMINI_API_KEY or ELEVENLABS_API_KEY in .env");
  }

  // EXAVITQu4vr4xnSDxMaL = Bella (Good for expressive parodies)
  const effectiveVoiceId = "EXAVITQu4vr4xnSDxMaL";

  // ──────── Step 1: Parse LRC ────────
  console.log("📝 Parsing LRC...");
  const lrcContent = readFileSync(LRC_PATH, "utf-8");
  const allLines = parseLrc(lrcContent);
  const lines = allLines.filter((l) => l.timeMs <= MAX_TIMESTAMP_SEC * 1000);
  console.log(`   Processed ${lines.length} lines.`);

  // ──────── Step 2: Gemini Parody ────────
  console.log("\n🤖 Generating lyrics with Gemini...");
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const lrcBlock = lines.map((l) => `[${l.timeMs}] ${l.line}`).join("\n");

  const kidsModeBlock = IS_KIDS_MODE
    ? `\n[ACTION: CLEAN/KIDS MODE ENABLED]
Strictly remove ALL profanity, drug references, violence, or inappropriate adult themes from the original lyrics. 
The replacement lyrics MUST be 100% wholesome and safe for children.
Even if the requested theme or custom idea is "funny", maintain a clean and family-friendly tone.`
    : "";

  const prompt = `You are a professional parody songwriter. Rewrite these lyrics as a ${THEME} parody.
${kidsModeBlock}

Theme: ${THEME}
Tone: ${TONE}
Audience: ${IS_KIDS_MODE ? "kids" : "teens"}

Original LRC lines (timeMs in milliseconds + line):
${lrcBlock}

CRITICAL RULES:
1. Rewrite EVERY line individually.
2. Keep the EXACT same number of lines.
3. Keep the EXACT same timeMs values.
4. SYLLABLE MATCH: Each new line MUST have the same number of syllables as the original. This is non-negotiable for vocal sync.

Respond ONLY with valid JSON:
{
  "parodyLrcLines": [{"timeMs": number, "line": "rewritten line"}],
  "summaryNarration": "string",
  "transformationReport": { "changesCount": number, "mainTheme": "string", "toneUsed": "string", "highlights": ["string"] },
  "generatedAt": "string"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const parodyResult = JSON.parse(response.text ?? "");
  console.log("   ✓ Lyrics generated.");

  // ──────── Step 3: ElevenLabs TTS ────────
  console.log("\n🎤 Generating TTS vocals...");
  const segments: Array<{ timeMs: number; audioBuffer: Buffer }> = [];

  for (let i = 0; i < parodyResult.parodyLrcLines.length; i++) {
    const line = parodyResult.parodyLrcLines[i];
    process.stdout.write(
      `   [Line ${i + 1}/${parodyResult.parodyLrcLines.length}] Synthesizing...`,
    );
    const audioBuffer = await synthesizeLine(
      line.line,
      effectiveVoiceId,
      elevenLabsKey,
    );
    console.log(` ✓`);
    segments.push({ timeMs: line.timeMs, audioBuffer });
  }

  // ──────── Step 4: FFmpeg Mix + Autotune ────────
  console.log("\n🎛️  Mixing with FFmpeg (Applying HEAVY AUTOTUNE filters)...");
  const workDir = mkdtempSync(join(tmpdir(), "parody-mix-"));

  try {
    const instrumentalPath = join(workDir, "instrumental.mp3");
    execFileSync("ffmpeg", [
      "-y",
      "-i",
      INSTRUMENTAL_PATH,
      "-c:a",
      "libmp3lame",
      "-q:a",
      "2",
      instrumentalPath,
    ]);

    const segmentPaths: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const p = join(workDir, `vocal_${i}.mp3`);
      writeFileSync(p, segments[i].audioBuffer);
      segmentPaths.push(p);
    }

    const buildMix = (includeInstrumental: boolean, outputName: string) => {
      const inputs: string[] = ["-y"];
      if (includeInstrumental) inputs.push("-i", instrumentalPath);
      for (const sp of segmentPaths) inputs.push("-i", sp);

      const filters: string[] = [];
      const offset = includeInstrumental ? 1 : 0;

      // CLEAN MIX (No autotune)
      for (let i = 0; i < segments.length; i++) {
        const delayMs = Math.round(segments[i].timeMs);
        filters.push(
          `[${i + offset}:a]adelay=${delayMs}|${delayMs},aresample=async=1,volume=2.0[v${i}]`,
        );
      }

      const vocalInputs = segments.map((_, i) => `[v${i}]`).join("");
      filters.push(
        `${vocalInputs}amix=inputs=${segments.length}:duration=longest:dropout_transition=0:normalize=0[vocals]`,
      );

      if (includeInstrumental) {
        filters.push(
          `[0:a]volume=0.25[inst];[inst][vocals]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]`,
        );
        inputs.push("-filter_complex", filters.join(";"), "-map", "[out]");
      } else {
        inputs.push("-filter_complex", filters.join(";"), "-map", "[vocals]");
      }

      const outPath = join(workDir, outputName);
      // Write to WAV (lossless, no psicoacoustic model crash)
      inputs.push("-c:a", "pcm_s16le", outPath);
      execFileSync("ffmpeg", inputs);
      return outPath;
    };

    console.log("   Building intermediate WAV mixes...");
    const finalWav = buildMix(true, "final.wav");
    const vocalWav = buildMix(false, "vocals.wav");

    // Convert WAV to MP3
    console.log("   Encoding final MP3s...");
    const finalMp3 = join(workDir, "final.mp3");
    const vocalMp3 = join(workDir, "vocals.mp3");
    execFileSync("ffmpeg", [
      "-y",
      "-i",
      finalWav,
      "-c:a",
      "libmp3lame",
      "-q:a",
      "2",
      finalMp3,
    ]);
    execFileSync("ffmpeg", [
      "-y",
      "-i",
      vocalWav,
      "-c:a",
      "libmp3lame",
      "-q:a",
      "2",
      vocalMp3,
    ]);

    // ──────── Step 5: (Optional) Pro Autotune ────────
    let finalMixedToSave = finalMp3;
    let finalVocalsToSave = vocalMp3;

    if (USE_PRO_AUTOTUNE) {
      console.log("\n🚀 Step 5: Applying PRO Autotune to full track...");
      const autotunedVocals = join(workDir, "vocals_pro.wav");
      const autotunedMixed = join(workDir, "final_pro.mp3");

      try {
        // 1. Snapping pitch in Python
        execFileSync("python3", [
          "scripts/autotune_engine.py",
          "--input",
          vocalMp3,
          "--output",
          autotunedVocals,
          "--strength",
          String(AUTOTUNE_STRENGTH),
        ]);

        // 2. Mix back with instrumental
        // We add a tiny bit of chorus for that 'pro' sheen
        const filters = `[0:a]chorus=0.5:0.7:50:0.4:0.25:2,volume=2.0[v]; [1:a]volume=0.20[inst]; [inst][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]`;
        execFileSync("ffmpeg", [
          "-y",
          "-i",
          autotunedVocals,
          "-i",
          instrumentalPath,
          "-filter_complex",
          filters,
          "-map",
          "[out]",
          "-c:a",
          "libmp3lame",
          "-q:a",
          "2",
          autotunedMixed,
        ]);

        finalMixedToSave = autotunedMixed;
        finalVocalsToSave = autotunedVocals;
        console.log("   ✅ Pro Autotune Applied.");
      } catch (e) {
        console.error("   ❌ Pro Autotune failed, using clean version.", e);
      }
    }

    // ──────── Step 6: (Optional) Replicate RVC Voice Conversion ────────
    if (USE_VOICE_CONVERSION) {
      console.log("\n🎙️  Step 6: Replicate Voice Conversion (Studio Skin)...");
      const voicePreset = pickVoiceForGenre(SONG_GENRE);
      console.log(`   Using voice: ${voicePreset.name}`);

      try {
        const vocalsToConvert = readFileSync(finalVocalsToSave);
        const convertedBuffer = await convertVoice(
          Buffer.from(vocalsToConvert),
          { genre: SONG_GENRE },
        );

        // Save converted vocals
        const convertedVocalsPath = join(workDir, "vocals_rvc.mp3");
        writeFileSync(convertedVocalsPath, convertedBuffer);
        finalVocalsToSave = convertedVocalsPath;

        // Re-mix with instrumental
        const convertedMixPath = join(workDir, "final_rvc.mp3");
        const mixFilters = `[0:a]volume=2.0[v]; [1:a]volume=0.25[inst]; [inst][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]`;
        execFileSync("ffmpeg", [
          "-y",
          "-i",
          convertedVocalsPath,
          "-i",
          instrumentalPath,
          "-filter_complex",
          mixFilters,
          "-map",
          "[out]",
          "-c:a",
          "libmp3lame",
          "-q:a",
          "2",
          convertedMixPath,
        ]);
        finalMixedToSave = convertedMixPath;

        console.log("   ✅ Voice conversion complete.");
      } catch (e) {
        console.error(
          "   ❌ Voice conversion failed, using previous vocals.",
          e,
        );
      }
    }

    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(
      join(OUTPUT_DIR, `${SONG_SLUG}-parody-mixed.mp3`),
      readFileSync(finalMixedToSave),
    );
    writeFileSync(
      join(OUTPUT_DIR, `${SONG_SLUG}-vocals-only.mp3`),
      readFileSync(finalVocalsToSave),
    );

    const lrcText = parodyResult.parodyLrcLines
      .map((l: any) => {
        const totalSec = l.timeMs / 1000;
        const min = Math.floor(totalSec / 60);
        const sec = (totalSec % 60).toFixed(2).padStart(5, "0");
        return `[${String(min).padStart(2, "0")}:${sec}]${l.line}`;
      })
      .join("\n");
    writeFileSync(join(OUTPUT_DIR, `${SONG_SLUG}-lyrics.lrc`), lrcText);
    writeFileSync(
      join(OUTPUT_DIR, "metadata.json"),
      JSON.stringify(parodyResult, null, 2),
    );

    console.log(`\n🚀 DONE! Check the generated folder:\n   ${OUTPUT_DIR}`);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch(console.error);
