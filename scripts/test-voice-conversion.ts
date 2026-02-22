#!/usr/bin/env tsx
/**
 * Quick test: just run voice conversion on existing vocals.
 * Usage: npx tsx --env-file .env scripts/test-voice-conversion.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { convertVoice } from "../src/lib/services/voice-conversion";

const INPUT = join(process.cwd(), "public/generated/mo-bamba-parody-final/mo-bamba-vocals-only.mp3");
const OUTPUT = join(process.cwd(), "public/generated/mo-bamba-parody-final/mo-bamba-vocals-drake.mp3");

async function main() {
  console.log("Loading vocals...");
  const vocals = readFileSync(INPUT);
  console.log(`Input: ${vocals.length} bytes`);

  console.log("Running voice conversion (Drake)...");
  const converted = await convertVoice(Buffer.from(vocals), { genre: "hip-hop" });

  writeFileSync(OUTPUT, converted);
  console.log(`Done! Output: ${OUTPUT} (${converted.length} bytes)`);
}

main().catch(console.error);
