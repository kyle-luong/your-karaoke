#!/usr/bin/env tsx
/**
 * End-to-end pipeline test: Generate a parody of "Humble" (first 20s)
 * with Gemini lyrics + ElevenLabs TTS vocals + ffmpeg mixing.
 *
 * Usage:
 *   npx tsx --env-file .env scripts/test-humble-pipeline.ts
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

// ──────── Config ────────
const MAX_TIMESTAMP_SEC = 20;
const LRC_PATH = join(process.cwd(), "public/demo/lrcs/humble.txt");
const INSTRUMENTAL_PATH = join(
    process.cwd(),
    "public/demo/instrumentals/humble-instrumental.mp3",
);
const OUTPUT_DIR = join(process.cwd(), "public/generated/humble-test");

// ──────── LRC Parser ────────
function parseLrc(content: string) {
    return content
        .split("\n")
        .map((line) => {
            const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
            if (!match) return null;
            const timestamp =
                parseInt(match[1], 10) * 60 + parseFloat(match[2]);
            const text = match[3].trim();
            return text ? { timestamp, text } : null;
        })
        .filter(Boolean) as Array<{ timestamp: number; text: string }>;
}

// ──────── ElevenLabs TTS ────────
async function synthesizeLine(
    text: string,
    voiceId: string,
    apiKey: string,
): Promise<Buffer> {
    // Use the streaming endpoint with eleven_flash_v2_5 — works on free tier
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
                voice_settings: { stability: 0.5, similarity_boost: 0.75 },
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
    console.log("🎵 Humble Parody Pipeline Test (first 20s)\n");

    // Check env
    const geminiKey = process.env.GEMINI_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");
    if (!elevenLabsKey) throw new Error("Missing ELEVENLABS_API_KEY");
    const effectiveVoiceId = "ui0NMIinCTg8KvB4ogeV";
    console.log(`   Using voice: ${effectiveVoiceId}`);

    // ──────── Step 1: Parse & filter LRC ────────
    console.log("📝 Step 1: Parsing LRC file...");
    const lrcContent = readFileSync(LRC_PATH, "utf-8");
    const allLines = parseLrc(lrcContent);
    const lines = allLines.filter((l) => l.timestamp <= MAX_TIMESTAMP_SEC);
    console.log(
        `   Found ${allLines.length} total lines, using ${lines.length} lines (≤${MAX_TIMESTAMP_SEC}s)`,
    );
    lines.forEach((l) =>
        console.log(`   [${l.timestamp.toFixed(2)}s] ${l.text}`),
    );

    // ──────── Step 2: Generate parody with Gemini ────────
    console.log("\n🤖 Step 2: Generating parody lyrics with Gemini...");
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const lrcBlock = lines
        .map((l) => `[${l.timestamp}] ${l.text}`)
        .join("\n");

    const prompt = `You are a parody lyric generator. Rewrite these lyrics as a food-themed parody.

Theme: food
Tone: silly
Audience: teens

The lyrics are provided as timed LRC lines (timestamp in seconds + text). You MUST rewrite EACH line individually, keeping the EXACT same number of lines and the EXACT same timestamps. Return the rewritten lines in the "parodyLrcLines" array.

Original LRC lines:
${lrcBlock}

CRITICAL SYLLABLE RULE: Each rewritten line MUST have the EXACT same number of syllables as the corresponding original line. Count the syllables carefully before writing each line. The parody will be sung over the original melody, so syllable count must match precisely or the timing will be off.

For each line, follow this process:
1. Count the syllables in the original line.
2. Write a funny food-themed replacement.
3. Count the syllables in your replacement.
4. If they don't match, revise until they do.

Be creative and funny while strictly maintaining syllable counts.

Respond ONLY with valid JSON matching this exact schema:
{
  "parodyLrcLines": [{"timestamp": number, "text": "rewritten line"}],
  "summaryNarration": "string (≤300 chars summary for voice narration)",
  "transformationReport": {
    "changesCount": number,
    "mainTheme": "string",
    "toneUsed": "string",
    "highlights": ["string", "string"]
  },
  "generatedAt": "ISO8601 timestamp"
}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
    });

    const parodyResult = JSON.parse(response.text ?? "");
    console.log("   Summary:", parodyResult.summaryNarration);
    console.log("   Parody lines:");
    for (const l of parodyResult.parodyLrcLines) {
        console.log(`   [${l.timestamp}s] ${l.text}`);
    }

    // ──────── Step 3: Generate TTS vocals with ElevenLabs ────────
    console.log("\n🎤 Step 3: Generating TTS vocals with ElevenLabs...");
    const segments: Array<{
        timestamp: number;
        text: string;
        audioBuffer: Buffer;
    }> = [];

    for (const line of parodyResult.parodyLrcLines) {
        process.stdout.write(`   Synthesizing: "${line.text}"...`);
        const audioBuffer = await synthesizeLine(
            line.text,
            effectiveVoiceId,
            elevenLabsKey,
        );
        console.log(` ✓ ${(audioBuffer.length / 1024).toFixed(1)}KB`);
        segments.push({
            timestamp: line.timestamp,
            text: line.text,
            audioBuffer,
        });
    }

    // ──────── Step 4: Mix with ffmpeg ────────
    console.log("\n🎛️  Step 4: Mixing vocals onto instrumental with ffmpeg...");
    const workDir = mkdtempSync(join(tmpdir(), "humble-test-"));

    try {
        // Write instrumental (trimmed to ~25s for buffer)
        const instrumentalPath = join(workDir, "instrumental.mp3");
        execFileSync("ffmpeg", [
            "-y",
            "-i",
            INSTRUMENTAL_PATH,
            "-t",
            "25",
            "-c:a",
            "libmp3lame",
            "-q:a",
            "2",
            instrumentalPath,
        ]);
        console.log("   ✓ Instrumental trimmed to 25s");

        // Write each vocal segment to a temp file
        const segmentPaths: string[] = [];
        for (let i = 0; i < segments.length; i++) {
            const p = join(workDir, `vocal_${i}.mp3`);
            writeFileSync(p, segments[i].audioBuffer);
            segmentPaths.push(p);
        }
        console.log(`   ✓ Wrote ${segments.length} vocal segment files`);

        // Build ffmpeg filter_complex
        const outputPath = join(workDir, "final.mp3");
        const inputs: string[] = ["-y", "-i", instrumentalPath];
        for (const sp of segmentPaths) {
            inputs.push("-i", sp);
        }

        const filters: string[] = [];
        for (let i = 0; i < segments.length; i++) {
            const delayMs = Math.round(segments[i].timestamp * 1000);
            filters.push(
                `[${i + 1}:a]adelay=${delayMs}|${delayMs},volume=3.0[v${i}]`,
            );
        }

        // Mix all vocals together
        const vocalInputs = segments.map((_, i) => `[v${i}]`).join("");
        filters.push(
            `${vocalInputs}amix=inputs=${segments.length}:duration=longest:dropout_transition=0[vocals]`,
        );

        // Overlay vocals onto instrumental (keep instrumental low so voice stands out)
        filters.push(
            `[0:a]volume=0.10[inst];[inst][vocals]amix=inputs=2:duration=first:dropout_transition=0[out]`,
        );

        inputs.push(
            "-filter_complex",
            filters.join(";"),
            "-map",
            "[out]",
            "-c:a",
            "libmp3lame",
            "-q:a",
            "2",
            outputPath,
        );

        console.log("   Running ffmpeg mix...");
        execFileSync("ffmpeg", inputs);
        console.log("   ✓ Audio mixed successfully");

        // Build vocals-only output (no instrumental)
        const vocalsOutputPath = join(workDir, "vocals.mp3");
        const vocalsInputs: string[] = ["-y"];
        for (const sp of segmentPaths) {
            vocalsInputs.push("-i", sp);
        }

        const vocalsFilters: string[] = [];
        for (let i = 0; i < segments.length; i++) {
            const delayMs = Math.round(segments[i].timestamp * 1000);
            vocalsFilters.push(
                `[${i}:a]adelay=${delayMs}|${delayMs},volume=3.0[v${i}]`,
            );
        }
        const vocalsVocalInputs = segments
            .map((_, i) => `[v${i}]`)
            .join("");
        vocalsFilters.push(
            `${vocalsVocalInputs}amix=inputs=${segments.length}:duration=longest:dropout_transition=0[vocalsout]`,
        );
        vocalsInputs.push(
            "-filter_complex",
            vocalsFilters.join(";"),
            "-map",
            "[vocalsout]",
            "-c:a",
            "libmp3lame",
            "-q:a",
            "2",
            vocalsOutputPath,
        );

        console.log("   Running ffmpeg vocals-only...");
        execFileSync("ffmpeg", vocalsInputs);
        console.log("   ✓ Vocals-only track generated");

        // Copy outputs to public dir
        mkdirSync(OUTPUT_DIR, { recursive: true });

        const finalMp3 = join(OUTPUT_DIR, "humble-parody-20s.mp3");
        writeFileSync(finalMp3, readFileSync(outputPath));
        console.log(`   ✓ Mixed MP3 → ${finalMp3}`);

        const vocalsMp3 = join(OUTPUT_DIR, "humble-vocals-20s.mp3");
        writeFileSync(vocalsMp3, readFileSync(vocalsOutputPath));
        console.log(`   ✓ Vocals MP3 → ${vocalsMp3}`);

        const instrumentalOut = join(
            OUTPUT_DIR,
            "humble-instrumental-20s.mp3",
        );
        writeFileSync(instrumentalOut, readFileSync(instrumentalPath));
        console.log(`   ✓ Instrumental MP3 → ${instrumentalOut}`);

        // Save the parody LRC
        const lrcOutput = join(OUTPUT_DIR, "humble-parody-20s.lrc");
        const lrcText = parodyResult.parodyLrcLines
            .map((l: { timestamp: number; text: string }) => {
                const minutes = Math.floor(l.timestamp / 60);
                const seconds = (l.timestamp % 60).toFixed(2).padStart(5, "0");
                return `[${String(minutes).padStart(2, "0")}:${seconds}]${l.text}`;
            })
            .join("\n");
        writeFileSync(lrcOutput, lrcText);
        console.log(`   ✓ Parody LRC → ${lrcOutput}`);

        // Save metadata
        const metaOutput = join(OUTPUT_DIR, "metadata.json");
        writeFileSync(metaOutput, JSON.stringify(parodyResult, null, 2));
        console.log(`   ✓ Metadata → ${metaOutput}`);
    } finally {
        rmSync(workDir, { recursive: true, force: true });
    }

    console.log("\n✅ Pipeline test complete!");
    console.log(
        `\n🎧 Open to listen:\n   Mixed:        ${join(OUTPUT_DIR, "humble-parody-20s.mp3")}\n   Vocals only:  ${join(OUTPUT_DIR, "humble-vocals-20s.mp3")}\n   Instrumental: ${join(OUTPUT_DIR, "humble-instrumental-20s.mp3")}`,
    );
}

main().catch((err) => {
    console.error("\n❌ Pipeline failed:", err);
    process.exit(1);
});

