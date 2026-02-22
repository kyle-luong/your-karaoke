"use client";

import type { Song } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

// Background gradients for songs without a thumbnail
const GRADIENTS = [
  "from-pink-600 to-purple-900",
  "from-blue-600 to-indigo-900",
  "from-emerald-600 to-teal-900",
  "from-orange-500 to-red-800",
  "from-violet-600 to-fuchsia-900",
  "from-cyan-500 to-blue-800",
];

// Format 195 → "3:15"
function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

interface SongCardProps {
  song: Song;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}

export default function SongCard({
  song,
  index,
  isActive,
  onSelect,
}: SongCardProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <button onClick={onSelect} className="w-full text-left">
      <Card
        className={`group overflow-hidden border-2 transition-all cursor-pointer h-full
          ${isActive ? "border-primary shadow-lg" : "hover:shadow-xl hover:-translate-y-1"}
        `}
      >
        <CardHeader className="p-0 relative">
          {song.thumbnail_url ? (
            <img
              src={song.thumbnail_url}
              alt={song.title}
              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className={`w-full h-36 bg-linear-to-br ${gradient} flex items-center justify-center text-5xl`}
            >
              🎵
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2">
            <Badge className="bg-black/80 text-white font-mono border-none text-xs">
              {formatDuration(song.duration_seconds)}
            </Badge>
          </div>

          {/* Playing indicator */}
          {isActive && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
              ♪ Playing
            </Badge>
          )}

          {/* Content rating */}
          {!isActive && (
            <div className="absolute top-2 right-2">
              {song.is_explicit ? (
                <Badge className="bg-red-600 text-white text-[10px] font-bold border-none px-1.5 py-0.5">E</Badge>
              ) : (
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold border-none px-1.5 py-0.5 flex items-center gap-0.5">
                  <ShieldCheck className="size-2.5" /> Safe
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 space-y-1">
          <CardTitle className="text-sm font-bold line-clamp-1 uppercase">
            {song.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground uppercase">
            {song.artist}
          </p>
          {song.genre && (
            <Badge variant="outline" className="text-[10px] mt-1">
              {song.genre}
            </Badge>
          )}
        </CardContent>
      </Card>
    </button>
  );
}
