/**
 * Audio mixer — overlays generated vocal segments onto an instrumental track.
 *
 * Uses ffmpeg via child_process.  All work is done in a temp directory that is
 * cleaned up before the function returns.
 *
 * Public API:
 *   mixAudio(instrumentalBuf, segments) → { mixedMp3: Buffer, durationMs: number }
 */

import { execFile } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import type { VocalSegment } from "@/lib/elevenlabs-singing";

const execFileAsync = promisify(execFile);

/**
 * Use ffprobe to get the duration of an audio file in milliseconds.
 */
export async function probeDurationMs(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    filePath,
  ]);

  const info = JSON.parse(stdout);
  const seconds = parseFloat(info.format.duration);
  return Math.round(seconds * 1000);
}

/**
 * Overlay vocal segments onto an instrumental track and produce three MP3s:
 *   - mixedMp3: vocals overlaid onto instrumental (ready to play)
 *   - vocalsMp3: vocals only (for karaoke / custom mixing)
 *   - instrumentalMp3: instrumental only (pass-through of input)
 *
 * Strategy:
 *  1. Write the instrumental to a temp file.
 *  2. Write each vocal segment to its own temp file.
 *  3. Build an ffmpeg filter_complex that delays each vocal segment by its
 *     LRC timestamp, mixes them together, then:
 *       a. Output the vocals-only mix.
 *       b. Overlay the vocals onto the instrumental for the pre-mixed output.
 *  4. Read all outputs and return the buffers + duration.
 *
 * The instrumental duration is preserved — vocals that extend beyond the end
 * are trimmed automatically.
 */
export interface MixAudioResult {
  /** Pre-mixed MP3: vocals overlaid onto instrumental. */
  mixedMp3: Buffer;
  /** Vocals-only MP3: all vocal segments mixed together, no instrumental. */
  vocalsMp3: Buffer;
  /** Instrumental MP3: the original instrumental, passed through. */
  instrumentalMp3: Buffer;
  /** Duration of the mixed output in milliseconds. */
  durationMs: number;
}

export async function mixAudio(
  instrumentalBuffer: Buffer,
  segments: VocalSegment[],
): Promise<MixAudioResult> {
  // Create a temp working directory
  const workDir = await mkdtemp(join(tmpdir(), "karaoke-mix-"));

  try {
    // 1. Write instrumental
    const instrumentalPath = join(workDir, "instrumental.mp3");
    await writeFile(instrumentalPath, instrumentalBuffer);

    // 2. Write each vocal segment
    const segmentPaths: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const p = join(workDir, `vocal_${i}.mp3`);
      await writeFile(p, segments[i].audioBuffer);
      segmentPaths.push(p);
    }

    // 3. Build ffmpeg commands
    const mixedOutputPath = join(workDir, "final.mp3");
    const vocalsOutputPath = join(workDir, "vocals.mp3");

    if (segments.length === 0) {
      // No vocals — just copy the instrumental as the mixed output
      await execFileAsync("ffmpeg", [
        "-y",
        "-i",
        instrumentalPath,
        "-c:a",
        "libmp3lame",
        "-q:a",
        "2",
        mixedOutputPath,
      ]);

      // Create a silent vocals file matching instrumental duration
      const instDuration = await probeDurationMs(instrumentalPath);
      const instDurationSec = (instDuration / 1000).toFixed(3);
      await execFileAsync("ffmpeg", [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `anullsrc=r=44100:cl=stereo`,
        "-t",
        instDurationSec,
        "-c:a",
        "libmp3lame",
        "-q:a",
        "2",
        vocalsOutputPath,
      ]);
    } else {
      // Build input list: instrumental first, then each segment
      const inputs: string[] = ["-y", "-i", instrumentalPath];
      for (const sp of segmentPaths) {
        inputs.push("-i", sp);
      }

      // Build filter_complex
      const filters: string[] = [];

      for (let i = 0; i < segments.length; i++) {
        const delayMs = Math.round(segments[i].entry.timestamp * 1000);
        filters.push(
          `[${i + 1}:a]adelay=${delayMs}|${delayMs},volume=3.0[v${i}]`,
        );
      }

      // Mix all vocals together → [vocals]
      const vocalInputs = segments.map((_, i) => `[v${i}]`).join("");
      filters.push(
        `${vocalInputs}amix=inputs=${segments.length}:duration=longest:dropout_transition=0[vocals]`,
      );

      // Overlay vocals onto instrumental → [out]
      filters.push(
        `[0:a]volume=0.15[inst];[inst][vocals]amix=inputs=2:duration=first:dropout_transition=0[out]`,
      );

      const filterComplex = filters.join(";");

      // Pass 1: generate the pre-mixed output
      inputs.push(
        "-filter_complex",
        filterComplex,
        "-map",
        "[out]",
        "-c:a",
        "libmp3lame",
        "-q:a",
        "2",
        mixedOutputPath,
      );

      await execFileAsync("ffmpeg", inputs);

      // Pass 2: generate the vocals-only output
      const vocalsInputs: string[] = ["-y"];
      for (const sp of segmentPaths) {
        vocalsInputs.push("-i", sp);
      }

      const vocalsFilters: string[] = [];
      for (let i = 0; i < segments.length; i++) {
        const delayMs = Math.round(segments[i].entry.timestamp * 1000);
        vocalsFilters.push(
          `[${i}:a]adelay=${delayMs}|${delayMs},volume=3.0[v${i}]`,
        );
      }
      const vocalsVocalInputs = segments.map((_, i) => `[v${i}]`).join("");
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

      await execFileAsync("ffmpeg", vocalsInputs);
    }

    // 4. Read results
    const mixedMp3 = await readFile(mixedOutputPath);
    const vocalsMp3 = await readFile(vocalsOutputPath);
    const durationMs = await probeDurationMs(mixedOutputPath);

    return {
      mixedMp3,
      vocalsMp3,
      instrumentalMp3: instrumentalBuffer,
      durationMs,
    };
  } finally {
    // Cleanup temp dir
    await rm(workDir, { recursive: true, force: true }).catch(() => {
      /* ignore cleanup errors */
    });
  }
}
