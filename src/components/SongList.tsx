"use client";

import type { Song } from "@/lib/types/database";
import SongCard from "./SongCard";

interface SongListProps {
  songs: Song[];
  activeSongId: string | null;
  onSelectSong: (song: Song) => void;
}

// Renders a responsive grid of song cards
export default function SongList({
  songs,
  activeSongId,
  onSelectSong,
}: SongListProps) {
  if (songs.length === 0) {
    return (
      <div className="col-span-full py-20 text-center border-4 border-dashed rounded-3xl bg-muted/30">
        <p className="text-muted-foreground text-xl font-medium">
          No songs yet!
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Seed your database to start scrubbing songs.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {songs.map((song, i) => (
        <SongCard
          key={song.id}
          song={song}
          index={i}
          isActive={song.id === activeSongId}
          onSelect={() => onSelectSong(song)}
        />
      ))}
    </div>
  );
}
