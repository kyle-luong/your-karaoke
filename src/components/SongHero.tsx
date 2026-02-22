"use client";

import Link from "next/link";
import { Clock, Play, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Song } from "@/lib/types/database";

// Background gradients for songs without a thumbnail
const GRADIENTS = [
    "from-pink-600 to-purple-900",
    "from-blue-600 to-indigo-900",
    "from-emerald-600 to-teal-900",
    "from-orange-500 to-red-800",
    "from-violet-600 to-fuchsia-900",
];

function formatDuration(sec: number) {
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

interface SongHeroProps {
    song: Song;
}

export default function SongHero({ song }: SongHeroProps) {
    // Pick a consistent gradient based on song id
    const gradientIndex =
        song.id.charCodeAt(song.id.length - 1) % GRADIENTS.length;
    const gradient = GRADIENTS[gradientIndex];

    // Split genre into tags (e.g. "Hip-Hop" → ["Hip-Hop"])
    const genreTags = song.genre
        ? song.genre.split(/[,\/]/).map((g) => g.trim()).filter(Boolean)
        : [];

    return (
        <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Thumbnail / Placeholder */}
            <div className="w-48 h-48 shrink-0 rounded-2xl overflow-hidden shadow-lg">
                {song.thumbnail_url ? (
                    <img
                        src={song.thumbnail_url}
                        alt={song.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
                    >
                        <Music className="size-16 text-white/30" />
                    </div>
                )}
            </div>

            {/* Song Info */}
            <div className="flex flex-col gap-3">
                {/* Label */}
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                    Karaoke
                </span>

                {/* Title */}
                <h1 className="text-4xl font-black tracking-tight">
                    {song.title}
                </h1>

                {/* Artist */}
                <p className="text-lg text-muted-foreground font-medium">
                    {song.artist}
                </p>

                {/* Duration */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-4" />
                        {formatDuration(song.duration_seconds)}
                    </span>
                </div>

                {/* Genre tags */}
                {genreTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {genreTags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs font-medium px-3 py-1 rounded-full"
                            >
                                # {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Play button */}
                <Link
                    href={`/songs/karaoke?play=${song.id}`}
                    className="inline-flex items-center gap-2 mt-2 px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-fit"
                >
                    <Play className="size-5 fill-current" />
                    Play online
                </Link>
            </div>
        </div>
    );
}
