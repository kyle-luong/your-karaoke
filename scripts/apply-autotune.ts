#!/usr/bin/env tsx
/**
 * apply-autotune.ts: Apply vocal effects to an audio file.
 * Supports "expressive" (built-in) and "pro" (Python Pitch-Quantization) modes.
 */

import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync, existsSync } from "node:fs";

const { values } = parseArgs({
    options: {
        input: { type: "string" },
        output: { type: "string" },
        mix: { type: "string" },
        mode: { type: "string", default: "expressive" }, // 'pro' or 'expressive'
        strength: { type: "string", default: "1.0" },
    },
});

if (!values.input || !values.output) {
    console.error("Usage: npx tsx scripts/apply-autotune.ts --input <file> --output <file> [--mix <instrumental>] [--mode pro|expressive]");
    process.exit(1);
}

const input = values.input;
const output = values.output;
const mix = values.mix;
const mode = values.mode;
const strength = values.strength || "1.0";

async function main() {
    console.log(`🎙️  Applying autotune [${mode}] to: ${input}`);

    let currentInput = input;
    const workDir = mkdtempSync(join(tmpdir(), "autotune-work-"));

    try {
        if (mode === "pro") {
            console.log("   🚀 Mode: PRO (Pitch Quantization)");
            const quantizedVocal = join(workDir, "quantized.wav");

            try {
                console.log("   🔍 Running Python Pitch Engine...");
                execFileSync("python3", [
                    "scripts/autotune_engine.py",
                    "--input", input,
                    "--output", quantizedVocal,
                    "--strength", strength
                ], { stdio: "inherit" });

                if (existsSync(quantizedVocal)) {
                    console.log("   ✅ Pitch Quantization Complete.");
                    currentInput = quantizedVocal;
                }
            } catch (e) {
                console.error("   ❌ Python Pitch Engine failed. Falling back to Expressive mode.", e);
            }
        }

        // Now apply the final "Sound" (Chorus + Volume) and Mix
        console.log("   🎛️  Applying Final Mix...");

        // Pro mode already shifted the pitch, so we just add thickness (chorus)
        // Expressive mode adds the vibrato 'fake' autotune
        const vocalFilter = mode === "pro"
            ? "chorus=0.5:0.7:50:0.4:0.25:2,volume=2.0"
            : "vibrato=f=12:d=0.5,chorus=0.5:0.7:50:0.4:0.25:2,volume=2.5";

        const inputs = ["-y", "-i", currentInput];
        let complexFilter = `[0:a]${vocalFilter},aresample=async=1[vocals]`;

        if (mix) {
            inputs.push("-i", mix);
            complexFilter += `; [1:a]volume=0.20[inst]; [inst][vocals]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]`;
            inputs.push("-filter_complex", complexFilter, "-map", "[out]");
        } else {
            inputs.push("-filter_complex", complexFilter, "-map", "[vocals]");
        }

        inputs.push("-c:a", "libmp3lame", "-q:a", "2", output);
        execFileSync("ffmpeg", inputs);

        console.log(`\n🎉 DONE! Output saved to: ${output}`);

    } finally {
        rmSync(workDir, { recursive: true, force: true });
    }
}

main().catch(console.error);
