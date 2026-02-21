import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Player from "@/components/player";
import type { Song } from "@/lib/types/database";

export default async function LibraryPage() {
  const supabase = await createServerSupabase();
  const { data: songs } = await supabase.from("songs").select("*").order("title");

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Parody Karaoke Studio</h1>
        <p className="text-muted-foreground mt-2">
          Transform songs into AI-generated parodies and sing together
        </p>
      </header>

      <div className="mb-12 flex justify-center">
        <Player />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(songs as Song[] | null)?.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}

        {(!songs || songs.length === 0) && (
          <p className="col-span-full text-center text-muted-foreground">
            No songs yet. Run the seed SQL to add demo songs.
          </p>
        )}
      </div>
    </main>
  );
}

function SongCard({ song }: { song: Song }) {
  return (
    <Link href={`/project/new?songId=${song.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          {song.thumbnail_url ? (
            <img
              src={song.thumbnail_url}
              alt={song.title}
              className="rounded-lg w-full h-32 object-cover mb-2"
            />
          ) : (
            <div className="rounded-lg w-full h-32 bg-muted flex items-center justify-center mb-2 text-4xl">
              🎵
            </div>
          )}
          <CardTitle className="text-lg">{song.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{song.artist}</p>
          <p className="text-xs text-muted-foreground">
            {Math.floor(song.duration_seconds / 60)}:{String(song.duration_seconds % 60).padStart(2, "0")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
