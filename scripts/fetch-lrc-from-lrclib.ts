/**
 * Fetch synced lyrics from lrclib.net and push to Supabase.
 *
 * Run:  npx tsx --env-file=.env.local scripts/fetch-lrc-from-lrclib.ts
 *
 * lrclib.net is 100% free, no API key needed, no rate limits.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── LRC string → our JSON format ──────────────────────────────────
// lrclib returns synced lyrics as: "[mm:ss.xx] Line text\n..."
// We convert to: [{ timeMs: number, line: string }, ...]
function parseLrcString(lrc: string): { timeMs: number; line: string }[] {
  const lines = lrc.split("\n").filter((l) => l.trim());
  const result: { timeMs: number; line: string }[] = [];

  for (const raw of lines) {
    const match = raw.match(/^\[(\d+):(\d+)\.(\d+)\]\s*(.*)/);
    if (!match) continue;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    // handle both .xx (centiseconds) and .xxx (milliseconds)
    let fraction = parseInt(match[3], 10);
    if (match[3].length === 2) fraction *= 10; // centiseconds → ms

    const timeMs = minutes * 60000 + seconds * 1000 + fraction;
    const line = match[4].trim();

    result.push({ timeMs, line });
  }

  return result;
}

// ── Fetch synced lyrics from lrclib ───────────────────────────────
// Some songs have "ft." in artist which may not match, so we also
// try searching without the featured artist.
async function fetchLrc(
  title: string,
  artist: string,
  durationSeconds: number,
): Promise<{ timeMs: number; line: string }[] | null> {
  // Clean the title (remove trailing period, etc.)
  const cleanTitle = title.replace(/\.$/, "").trim();

  // Try search endpoint (more flexible matching)
  const params = new URLSearchParams({
    track_name: cleanTitle,
    artist_name: artist,
  });

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch("https://lrclib.net/api/search?" + params.toString(), {
        headers: {
          "User-Agent": "LyricLab/1.0 (https://github.com/your-karaoke)",
        },
      });
      break;
    } catch (e: any) {
      console.log(
        "    Retry " + (attempt + 1) + "/3 — " + (e.cause?.code ?? e.message),
      );
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  if (!res) return null;

  if (!res.ok) {
    console.log("    API returned " + res.status);
    return null;
  }

  const results: any[] = await res.json();

  if (results.length === 0) {
    // Try with just the primary artist (before "ft." or "feat.")
    const primaryArtist = artist.split(/\s+(ft\.?|feat\.?)\s+/i)[0].trim();
    if (primaryArtist !== artist) {
      console.log("    Retrying with primary artist: " + primaryArtist);
      return fetchLrc(cleanTitle, primaryArtist, durationSeconds);
    }
    return null;
  }

  // Find the best match: has synced lyrics AND closest duration
  const withSynced = results.filter((r) => r.syncedLyrics);
  if (withSynced.length === 0) {
    console.log(
      "    Found " + results.length + " results but none have synced lyrics",
    );
    return null;
  }

  // Sort by duration proximity
  withSynced.sort(
    (a, b) =>
      Math.abs(a.duration - durationSeconds) -
      Math.abs(b.duration - durationSeconds),
  );

  const best = withSynced[0];
  const durationDiff = Math.abs(best.duration - durationSeconds);
  console.log(
    '    Best match: "' +
      best.trackName +
      '" by ' +
      best.artistName +
      " (dur=" +
      best.duration +
      "s, diff=" +
      durationDiff +
      "s, " +
      withSynced.length +
      " synced results)",
  );

  return parseLrcString(best.syncedLyrics);
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching songs from Supabase...\n");

  const { data: songs, error } = await sb
    .from("songs")
    .select("id, title, artist, duration_seconds, lrc_data")
    .order("title");

  if (error || !songs) {
    console.error("Error fetching songs:", error);
    process.exit(1);
  }

  // Only process songs missing LRC data
  const missing = songs.filter(
    (s) => !Array.isArray(s.lrc_data) || s.lrc_data.length === 0,
  );

  console.log(
    "Total: " +
      songs.length +
      " songs, " +
      missing.length +
      " missing LRC data\n",
  );

  let success = 0;
  let failed = 0;

  for (const song of missing) {
    console.log(
      "[" +
        (success + failed + 1) +
        "/" +
        missing.length +
        "] " +
        song.title +
        " – " +
        song.artist,
    );

    const lrcData = await fetchLrc(
      song.title,
      song.artist,
      song.duration_seconds,
    );

    if (!lrcData || lrcData.length === 0) {
      console.log("    ❌ No synced lyrics found\n");
      failed++;
      continue;
    }

    // Update Supabase
    const { error: updateErr } = await sb
      .from("songs")
      .update({ lrc_data: lrcData })
      .eq("id", song.id);

    if (updateErr) {
      console.log("    ❌ Supabase update failed: " + updateErr.message + "\n");
      failed++;
    } else {
      console.log("    ✅ Saved " + lrcData.length + " synced lines\n");
      success++;
    }

    // Small delay to be respectful (even though there's no rate limit)
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n════════════════════════════════════════");
  console.log("Done! ✅ " + success + " updated, ❌ " + failed + " failed");
  console.log("════════════════════════════════════════");
}

main();
