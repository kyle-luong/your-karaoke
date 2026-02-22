"use client";

import { useState } from "react";
import { Search } from "lucide-react";

// Shape of a queue item — ready for future use
export interface QueueItem {
    id: string;
    title: string;
    artist: string;
    durationSeconds: number;
}

interface QueuePanelProps {
    items?: QueueItem[];
}

export default function QueuePanel({ items = [] }: QueuePanelProps) {
    const [filter, setFilter] = useState("");

    // Calculate totals
    const totalSongs = items.length;
    const totalMinutes = Math.floor(
        items.reduce((sum, item) => sum + item.durationSeconds, 0) / 60
    );

    // Filter items by title or artist
    const filtered = items.filter(
        (item) =>
            item.title.toLowerCase().includes(filter.toLowerCase()) ||
            item.artist.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="p-4 flex-1 flex flex-col">
            {/* Header row */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="font-bold text-sm">Queue</p>
                    <p className="text-xs text-muted-foreground">
                        {totalSongs} {totalSongs === 1 ? "song" : "songs"} · {totalMinutes}
                        min.
                    </p>
                </div>

                {/* Filter input */}
                <div className="flex items-center gap-2">
                    <Search className="size-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-muted/50 border rounded-md px-2 py-1 text-xs w-24 placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Queue content */}
            {filtered.length === 0 ? (
                // Empty state
                <div className="text-center py-12 space-y-2 flex-1 flex flex-col items-center justify-center">
                    <p className="font-semibold text-sm">Your queue is empty.</p>
                    <p className="text-xs text-muted-foreground">
                        Add songs or quizzes to your queue to keep singing.
                    </p>
                </div>
            ) : (
                // Queue items list
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {filtered.map((item, index) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                        >
                            <span className="text-xs text-muted-foreground font-mono w-5 text-center">
                                {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {item.artist}
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                {Math.floor(item.durationSeconds / 60)}:
                                {String(item.durationSeconds % 60).padStart(2, "0")}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
