"use client";

import { useState } from "react";
import { Play, Pause, SkipForward, Volume2 } from "lucide-react";

export default function PlayerWidget() {
    const [volume, setVolume] = useState(75);

    return (
        <div className="flex flex-col">
            {/* Album art / branding area */}
            <div className="h-52 bg-gradient-to-b from-purple-800 via-purple-900 to-muted/30 flex items-center justify-center relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.4),transparent_70%)]" />
                <span className="text-4xl font-black text-white/30 tracking-tighter italic relative z-10">
                    Lyric Lab
                </span>
            </div>

            {/* Now playing info + controls */}
            <div className="p-4 border-b space-y-3">
                {/* Now playing text */}
                <p className="text-sm text-muted-foreground italic">
                    No item is being played
                </p>

                {/* Playback controls + seekbar */}
                <div className="flex items-center gap-3">
                    <button
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Play"
                    >
                        <Play className="size-5" />
                    </button>
                    <button
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Skip forward"
                    >
                        <SkipForward className="size-5" />
                    </button>

                    {/* Current time */}
                    <span className="text-xs text-muted-foreground font-mono min-w-[2rem]">
                        0:00
                    </span>

                    {/* Seekbar */}
                    <div className="flex-1 h-1 bg-muted rounded-full relative group cursor-pointer">
                        <div className="h-full w-0 bg-primary rounded-full" />
                        {/* Seek dot (shows on hover) */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 size-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Remaining time */}
                    <span className="text-xs text-muted-foreground font-mono min-w-[2.5rem] text-right">
                        -0:00
                    </span>
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-2">
                    <Volume2 className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 relative h-1 bg-muted rounded-full">
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${volume}%` }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            aria-label="Volume"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
