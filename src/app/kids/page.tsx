import { createServerSupabase } from "@/lib/supabase/server";
import { KidsSongGrid } from "./kids-song-grid";
import type { Song, Version } from "@/lib/types/database";

export type Remix = { version: Version; song: Song; songId: string };

export default async function KidsPage() {
  const supabase = await createServerSupabase();

  const { data: songs } = await supabase
    .from("songs")
    .select("*")
    .eq("is_child_safe", true)
    .order("title");

  const typedSongs = (songs as Song[]) ?? [];

  // Fetch parody remixes on kid-safe songs
  const { data: versions } = await supabase
    .from("versions")
    .select("*, projects!inner(song_id)")
    .eq("type", "parody")
    .order("created_at", { ascending: false })
    .limit(20);

  const songMap = new Map<string, Song>();
  typedSongs.forEach((s) => songMap.set(s.id, s));

  const remixes: Remix[] = [];
  if (versions) {
    for (const v of versions as (Version & { projects: { song_id: string } })[]) {
      const song = songMap.get(v.projects.song_id);
      if (song) {
        remixes.push({ version: v, song, songId: v.projects.song_id });
      }
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] pb-10">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            Pick a Song!
          </span>{" "}
          🎤
        </h1>
      </div>

      <KidsSongGrid songs={typedSongs} remixes={remixes} />

      <footer className="max-w-6xl mx-auto px-6 py-4 text-center space-y-1 border-t border-border mt-8">
        <p className="text-xs text-muted-foreground">
          Lyric Lab Kids — Only safe, fun songs for young singers!
        </p>
      </footer>
    </main>
  );
}
