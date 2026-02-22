"use client";

import { useState } from "react";
import type { Song } from "@/lib/types/database";
import SongList from "./SongList";

interface SongBrowserProps {
  songs: Song[];
}

// Manages which song is selected and renders the song grid
export default function SongBrowser({ songs }: SongBrowserProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <SongList
      songs={songs}
      activeSongId={selectedId}
      onSelectSong={(song) => setSelectedId(song.id)}
    />
  );
}
