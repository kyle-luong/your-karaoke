"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Music, Mic2, Guitar, Zap, Heart, ShieldCheck, Sparkles } from "lucide-react";
import type { Song } from "@/lib/types/database";
import type { Remix } from "./page";

const GENRES = [
  { name: "All", icon: Music, color: "text-primary" },
  { name: "Remixes", icon: Sparkles, color: "text-purple-500" },
  { name: "Rap", icon: Mic2, color: "text-blue-500", match: ["Hip-Hop", "Rap"] },
  { name: "Pop", icon: Music, color: "text-pink-500", match: ["Pop"] },
  { name: "Country", icon: Guitar, color: "text-orange-500", match: ["Country"] },
  { name: "Rock", icon: Zap, color: "text-yellow-500", match: ["Rock"] },
  { name: "R&B", icon: Heart, color: "text-red-500", match: ["R&B"] },
];

const GRADIENTS = [
  "from-pink-600 to-purple-900",
  "from-blue-600 to-indigo-900",
  "from-emerald-600 to-teal-900",
  "from-orange-500 to-red-800",
  "from-violet-600 to-fuchsia-900",
  "from-cyan-500 to-blue-800",
  "from-rose-500 to-pink-900",
  "from-amber-500 to-orange-800",
];

function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function KidsSongGrid({ songs, remixes }: { songs: Song[]; remixes: Remix[] }) {
  const [genre, setGenre] = useState("All");

  const showRemixes = genre === "Remixes";

  const filtered =
    genre === "All" || genre === "Remixes"
      ? songs
      : songs.filter((s) => {
          const g = GENRES.find((g) => g.name === genre);
          return g?.match?.some((m) =>
            s.genre?.toLowerCase().includes(m.toLowerCase())
          );
        });

  return (
    <>
      {/* Genre filter pills */}
      <div className="max-w-6xl mx-auto px-6 flex gap-2 justify-center flex-wrap pb-6">
        {GENRES.map((g) => (
          <button
            key={g.name}
            onClick={() => setGenre(g.name)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              genre === g.name
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "bg-card border border-border/40 text-foreground hover:-translate-y-0.5 hover:shadow-sm"
            }`}
          >
            <g.icon className={`size-4 ${genre === g.name ? "text-primary-foreground" : g.color}`} />
            {g.name}
          </button>
        ))}
      </div>

      {/* Remix grid */}
      {showRemixes ? (
        remixes.length === 0 ? (
          <div className="max-w-6xl mx-auto px-6 py-16 text-center text-muted-foreground">
            No remixes yet!
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-6 kids-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {remixes.map((r, i) => (
              <Link
                href={`/songs/karaoke?song=${r.songId}&version=${r.version.id}`}
                key={r.version.id}
                className="kids-bounce"
              >
                <div className="kids-card group cursor-pointer">
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-sm mb-3 relative">
                    {r.song.thumbnail_url ? (
                      <img
                        src={r.song.thumbnail_url}
                        alt={r.song.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-75"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-linear-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center`}
                      >
                        <Sparkles className="size-12 text-white/40" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary text-primary-foreground text-xs font-bold border-none px-2 py-0.5 uppercase">
                        Remix
                      </Badge>
                    </div>
                  </div>
                  <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                    {r.song.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Parody · {r.song.artist}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        /* Song grid */
        filtered.length === 0 ? (
          <div className="max-w-6xl mx-auto px-6 py-16 text-center text-muted-foreground">
            No kid-safe songs in this category yet!
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-6 kids-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filtered.map((song, i) => (
              <Link
                href={`/songs/karaoke?song=${song.id}`}
                key={song.id}
                className="kids-bounce"
              >
                <div className="kids-card group cursor-pointer">
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-sm mb-3 relative">
                    {song.thumbnail_url ? (
                      <img
                        src={song.thumbnail_url}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-linear-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center`}
                      >
                        <Music className="size-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2">
                      <Badge className="bg-black/70 text-white text-xs font-mono border-none px-2 py-0.5">
                        {formatDuration(song.duration_seconds)}
                      </Badge>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-emerald-600 text-white text-xs font-bold border-none px-2 py-0.5 flex items-center gap-1">
                        <ShieldCheck className="size-3" /> Safe
                      </Badge>
                    </div>
                  </div>
                  <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                    {song.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {song.artist}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </>
  );
}
