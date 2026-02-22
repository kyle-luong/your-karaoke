import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data: songs } = await sb
    .from("songs")
    .select("id, title, artist, duration_seconds, lrc_data");

  for (const s of songs ?? []) {
    const hasLrc = Array.isArray(s.lrc_data) && s.lrc_data.length > 0;
    const icon = hasLrc ? "OK" : "MISSING";
    console.log(
      "[" +
        icon +
        "] " +
        s.title +
        " | " +
        s.artist +
        " | dur=" +
        s.duration_seconds +
        "s | lines=" +
        (hasLrc ? s.lrc_data.length : 0),
    );
  }

  const total = songs?.length ?? 0;
  const withLrc =
    songs?.filter(
      (s: any) => Array.isArray(s.lrc_data) && s.lrc_data.length > 0,
    ).length ?? 0;
  console.log(
    "\nTotal: " +
      total +
      " songs, " +
      withLrc +
      " with LRC, " +
      (total - withLrc) +
      " missing",
  );
}

main();
