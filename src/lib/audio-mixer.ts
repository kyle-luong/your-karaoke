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
 * Overlay vocal segments onto an instrumental track and produce a single MP3.
 *
 * Strategy:
 *  1. Write the instrumental to a temp file.
 *  2. Write each vocal segment to its own temp file.
 *  3. Build an ffmpeg filter_complex that delays each vocal segment by its
 *     LRC timestamp, mixes them together, then overlays the mix onto the
 *     instrumental.
 *  4. Read the output MP3 and return the buffer + duration.
 *
 * The instrumental duration is preserved — vocals that extend beyond the end
 * are trimmed automatically.
 */
export async function mixAudio(
  instrumentalBuffer: Buffer,
  segments: VocalSegment[],
): Promise<{ mixedMp3: Buffer; durationMs: number }> {
  // Create a temp working directory
  const workDir = await mkdtemp(join(tmpdir(), "karaoke-mix-"));

  try {
    // 1. Write instrumental
    const instrumentalPath = join(workDir, "instrumental.mp3");
    await writeFile(instrumentalPath, instrumentalBuffer);

    const instrumentalDuration = await probeDurationMs(instrumentalPath);

    // 2. Write each vocal segment
    const segmentPaths: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const p = join(workDir, `vocal_${i}.mp3`);
      await writeFile(p, segments[i].audioBuffer);
      segmentPaths.push(p);
    }

    // 3. Build ffmpeg command
    const outputPath = join(workDir, "final.mp3");

    if (segments.length === 0) {
      // No vocals — just copy the instrumental
      await execFileAsync("ffmpeg", [
        "-y",
        "-i",
        instrumentalPath,
        "-c:a",
        "libmp3lame",
        "-q:a",
        "2",
        outputPath,
      ]);
    } else {
      // Build input list: instrumental first, then each segment
      const inputs: string[] = ["-y", "-i", instrumentalPath];
      for (const sp of segmentPaths) {
        inputs.push("-i", sp);
      }

      // Build filter_complex
      // For each vocal segment: delay it by its LRC timeMs, then mix all
      // delayed vocals together, then overlay onto instrumental.
      const filters: string[] = [];

      for (let i = 0; i < segments.length; i++) {
        // entry.timestamp is in seconds; adelay needs milliseconds
        const delayMs = Math.round(segments[i].entry.timestamp * 1000);
        // [inputIndex+1] because [0] is instrumental
        filters.push(
          `[${i + 1}:a]adelay=${delayMs}|${delayMs},volume=1.0[v${i}]`,
        );
      }

      // Mix all vocals together
      const vocalInputs = segments.map((_, i) => `[v${i}]`).join("");
      filters.push(
        `${vocalInputs}amix=inputs=${segments.length}:duration=longest:dropout_transition=0[vocals]`,
      );

      // Overlay vocals onto instrumental
      filters.push(
        `[0:a][vocals]amix=inputs=2:duration=first:dropout_transition=0[out]`,
      );

      const filterComplex = filters.join(";");

      inputs.push(
        "-filter_complex",
        filterComplex,
        "-map",
        "[out]",
        "-c:a",
        "libmp3lame",
        "-q:a",
        "2",
        outputPath,
      );

      await execFileAsync("ffmpeg", inputs);
    }

    // 4. Read result
    const mixedMp3 = await readFile(outputPath);
    const durationMs = await probeDurationMs(outputPath);

    return { mixedMp3, durationMs };
  } finally {
    // Cleanup temp dir
    await rm(workDir, { recursive: true, force: true }).catch(() => {
      /* ignore cleanup errors */
    });
  }
}
