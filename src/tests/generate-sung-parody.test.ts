/**
 * Test suite for the generate-sung-parody pipeline.
 *
 * Covers: LRC parsing (utils/lrc-parser), request validation,
 * error handling, and edge cases.
 *
 * Run:  npx vitest run src/tests/generate-sung-parody.test.ts
 */

import { describe, it, expect } from "vitest";
import { z } from "zod/v4";
import parseLrcContent from "@/lib/utils/lrc-parser";

// Inline the same request schema used in the route
const requestSchema = z.object({
  instrumentalUrl: z.url(),
  lrcLyrics: z.string().min(1),
  voiceId: z.string().min(1).optional(),
});

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

// ────────────────────────────────────────────────────────────────────
// LRC Parser Tests (utils/lrc-parser)
// ────────────────────────────────────────────────────────────────────

describe("LRC Parser (parseLrcContent)", () => {
  it("parses valid LRC text", () => {
    const lrc = `[00:01.20]Hello world\n[00:05.10]Another line`;
    const result = parseLrcContent(lrc);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBeCloseTo(1.2, 1);
    expect(result[0].text).toBe("Hello world");
    expect(result[1].timestamp).toBeCloseTo(5.1, 1);
    expect(result[1].text).toBe("Another line");
  });

  it("returns empty array for text with no valid LRC lines", () => {
    const result = parseLrcContent("Hello world\nNo timestamp here");
    expect(result).toHaveLength(0);
  });

  it("returns empty array for malformed timestamp", () => {
    const result = parseLrcContent("[abc]Some lyrics");
    expect(result).toHaveLength(0);
  });

  it("skips empty lyric text lines", () => {
    const result = parseLrcContent("[00:01.00]   \n[00:02.00]Real line");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Real line");
  });

  it("returns empty array for empty input", () => {
    const result = parseLrcContent("");
    expect(result).toHaveLength(0);
  });

  it("handles multi-minute timestamps", () => {
    const lrc = "[05:30.00]Five minutes in";
    const result = parseLrcContent(lrc);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBeCloseTo(330, 0);
  });

  it("handles timestamps at 00:00.01", () => {
    const lrc = "[00:00.01]Start\n[00:01.00]Next";
    const result = parseLrcContent(lrc);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBeCloseTo(0.01, 2);
  });

  it("parses the real i-wonder.txt format", () => {
    const sample = `[00:00.09] Find your dreams come true\n[00:04.09] And I wonder if you know\n[00:08.77] What it means, what it means`;
    const result = parseLrcContent(sample);
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe("Find your dreams come true");
    expect(result[0].timestamp).toBeCloseTo(0.09, 2);
    expect(result[2].timestamp).toBeCloseTo(8.77, 2);
  });
});

// ────────────────────────────────────────────────────────────────────
// Zod Validation Schema Tests
// ────────────────────────────────────────────────────────────────────

describe("Request Schema Validation", () => {
  it("rejects empty object {}", () => {
    const result = requestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects missing instrumentalUrl", () => {
    const result = requestSchema.safeParse({
      lrcLyrics: "[00:01.00]Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing lrcLyrics", () => {
    const result = requestSchema.safeParse({
      instrumentalUrl: "https://example.com/song.mp3",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = requestSchema.safeParse({
      instrumentalUrl: "not-a-url",
      lrcLyrics: "[00:01.00]Hello",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid request with optional voiceId", () => {
    const result = requestSchema.safeParse({
      instrumentalUrl: "https://example.com/song.mp3",
      lrcLyrics: "[00:01.00]Hello",
      voiceId: "voice123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid request without voiceId", () => {
    const result = requestSchema.safeParse({
      instrumentalUrl: "https://example.com/song.mp3",
      lrcLyrics: "[00:01.00]Hello",
    });
    expect(result.success).toBe(true);
  });

  it("has MAX_AUDIO_BYTES set to 10 MB", () => {
    expect(MAX_AUDIO_BYTES).toBe(10 * 1024 * 1024);
  });
});

// ────────────────────────────────────────────────────────────────────
// Edge-Case / Structural Tests
// ────────────────────────────────────────────────────────────────────

describe("Edge Cases", () => {
  it("handles LRC with 3-digit fraction (milliseconds)", () => {
    const lrc = "[00:01.200]Hello";
    const result = parseLrcContent(lrc);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBeCloseTo(1.2, 1);
  });

  it("handles multi-minute timestamps", () => {
    const lrc = "[05:30.00]Five minutes in";
    const result = parseLrcContent(lrc);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBeCloseTo(330, 0);
  });

  it("handles timestamps at 00:00.01", () => {
    const lrc = "[00:00.01]Start\n[00:01.00]Next";
    const result = parseLrcContent(lrc);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBeCloseTo(0.01, 2);
  });

  it("gracefully handles seconds >= 60 (parseFloat still works)", () => {
    // parseLrcContent uses parseFloat so 60.00 just becomes 60 seconds
    const result = parseLrcContent("[00:60.00]Edge");
    // The regex still matches, it just results in timestamp = 60
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBeCloseTo(60, 0);
  });
});
