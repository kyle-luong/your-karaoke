/**
 * Migration script: Add is_child_safe column and set values for all songs
 *
 * Run with:  npx tsx scripts/migrate-child-safe.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing env vars. Run with: npx tsx --env-file=.env.local scripts/migrate-child-safe.ts",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Song classification based on lyrics & artist research ──────────
// Songs that are EXPLICIT (profanity, drugs, violence, strong adult themes)
const EXPLICIT_SONG_IDS = new Set([
  "c2df4d75-f9ed-4d64-9b96-418552ac4687", // SICKO MODE – Travis Scott
  "b1d61284-f783-47e8-a84b-40ec664261ae", // Lose Yourself – Eminem
  "769cbef0-62c6-4530-a7ac-7eaa32cabf03", // Mo Bamba – Sheck Wes
  "a9ff55e8-f177-4a6e-9b66-01a4b7343806", // In Da Club – 50 Cent
  "d5dad351-8187-460e-b5c5-05f768e0af67", // Bodak Yellow – Cardi B
  "b1c07e8b-4fc2-4496-9f90-ae7dc6c633de", // Humble – Kendrick Lamar
  "b72b997e-cf2a-4fd5-9a55-8f055bd70277", // Empire State of Mind – Jay-Z
  "49682646-3c91-4392-9a2d-341cd5ba57bf", // No Guidance – Chris Brown ft. Drake
  "c097fe4e-4521-4c41-baa6-16e09aaee1e2", // First Class – Jack Harlow
  "de253675-06c9-4c90-bb23-99a4499280ac", // Starboy – The Weeknd ft. Daft Punk
]);

// Songs that are CHILD-SAFE (reviewed, clean lyrics, appropriate themes)
const CHILD_SAFE_SONG_IDS = new Set([
  "29d87c2c-2963-4d37-9e1e-39a7928c2623", // Don't Stop Believin' – Journey
  "8476a3a4-08cb-4da5-9744-2b24dcda34c2", // Shake It Off – Taylor Swift
  "ab6a2e61-7cfe-4930-9b4b-ecc490f3a568", // Firework – Katy Perry
  "0f5c5985-7c73-4401-aac9-72645dec2b29", // Levitating – Dua Lipa
  "ea883b75-d77c-437b-930c-0a30f05946cd", // Believer – Imagine Dragons
  "922e7ce7-e01c-4b04-8772-a521e0ff939f", // Radioactive – Imagine Dragons
  "8a4a1daf-caba-49b4-aec0-0c9be57d4f93", // Rolling in the Deep – Adele
  "e2b4c408-2577-4bf9-bdd4-7187f3d81733", // Someone Like You – Adele
  "0e4360b3-cdac-4adf-b9a7-4f8b7e190f76", // Uptown Funk – Bruno Mars
  "1de6022d-179d-4ecf-ba97-fc23730f54da", // Sweet Home Alabama – Lynyrd Skynyrd
  "1318260e-c3ae-4686-b8e1-95519837f100", // Seven Nation Army – The White Stripes
  "cc5e0a17-5f4a-4fe1-af3a-21568a85d2c8", // Wagon Wheel – Darius Rucker
  "61c788d7-e5aa-46c2-81df-22675e9d9881", // Fast Car – Luke Combs
  "d60f981b-c34b-4334-99c8-74b5d7a197b7", // Respect – Aretha Franklin
  "407a6ebc-720d-4c1c-95e9-5522e27a0928", // Flowers – Miley Cyrus
  "c4dc0108-e4cf-42b6-a136-3dc9fe60d53d", // Blinding Lights – The Weeknd
  "50458569-f71f-48e2-84b0-7398add5e11d", // Die For You – The Weeknd
  "a610edad-d530-406f-a5f9-f03e869b4f7f", // God's Plan – Drake (radio version, clean)
  "398d1909-69b3-468e-a06a-bf8c9b29be26", // Cruel Summer – Taylor Swift
  "6967d8f6-1c66-4bf3-8369-22a5a9bff3e4", // We Belong Together – Mariah Carey
  "033fc907-431f-4929-abae-36535840a083", // Shape of You – Ed Sheeran
  "07368422-ac8e-4cec-8a87-6e41d0fd4403", // Old Town Road – Lil Nas X
]);

// Everything else is NEITHER: clean-ish but not yet reviewed for kids
// (Hotline Bling, Super Bass, I Wonder, Crazy in Love, Cuff It, Anti-Hero,
//  Greedy, Bohemian Rhapsody, Smells Like Teen Spirit, Basket Case,
//  Tennessee Whiskey, Friends in Low Places, Before He Cheats, Watermelon Sugar)

async function main() {
  console.log("🔍 Fetching all songs from database...\n");

  const { data: songs, error } = await supabase
    .from("songs")
    .select("id, title, artist, genre");

  if (error) {
    console.error("Error fetching songs:", error);
    process.exit(1);
  }

  console.log(`Found ${songs.length} songs. Classifying...\n`);

  // ── Step 1: Try to add the is_child_safe column ──
  // We can't run ALTER TABLE via REST API, so we'll check if the column exists
  // by trying to read it first.
  const { error: colCheck } = await supabase
    .from("songs")
    .select("is_child_safe")
    .limit(1);

  if (colCheck) {
    console.log("⚠️  Column 'is_child_safe' does not exist yet.");
    console.log(
      "   Please run this SQL in your Supabase Dashboard → SQL Editor:\n",
    );
    console.log(
      "   ALTER TABLE songs ADD COLUMN is_child_safe boolean NOT NULL DEFAULT false;\n",
    );
    console.log("   Then re-run this script.\n");
    process.exit(1);
  }

  console.log("✅ Column 'is_child_safe' exists. Setting values...\n");

  // ── Step 2: Set is_child_safe = true for kid-safe songs ──
  let updated = 0;
  let errors = 0;

  for (const song of songs) {
    const isChildSafe = CHILD_SAFE_SONG_IDS.has(song.id);

    const { error: updateErr } = await supabase
      .from("songs")
      .update({ is_child_safe: isChildSafe })
      .eq("id", song.id);

    if (updateErr) {
      console.error(`  ❌ ${song.title} – ${updateErr.message}`);
      errors++;
    } else {
      const label = isChildSafe
        ? "🟢 Kid-Safe"
        : EXPLICIT_SONG_IDS.has(song.id)
          ? "🔴 Explicit"
          : "⚪ Unreviewed";
      console.log(`  ${label}  ${song.title} – ${song.artist}`);
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated} songs (${errors} errors)`);
  console.log("\nSummary:");
  console.log(
    `  🟢 Kid-Safe:    ${songs.filter((s) => CHILD_SAFE_SONG_IDS.has(s.id)).length}`,
  );
  console.log(
    `  🔴 Explicit:    ${songs.filter((s) => EXPLICIT_SONG_IDS.has(s.id)).length}`,
  );
  console.log(
    `  ⚪ Unreviewed:  ${songs.filter((s) => !CHILD_SAFE_SONG_IDS.has(s.id) && !EXPLICIT_SONG_IDS.has(s.id)).length}`,
  );
}

main();
