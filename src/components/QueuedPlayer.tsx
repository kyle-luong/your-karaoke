"use client";

import { useEffect, useState, useRef } from "react";
import Player, { Song } from "./player";

interface QueuedPlayerProps {
  initialQueue?: Song[];
  compact?: boolean;
}

export default function QueuedPlayer({
  initialQueue = [],
  compact = true,
}: QueuedPlayerProps) {
  const [queue, setQueue] = useState<Song[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Vertical resize state
  const [playerHeight, setPlayerHeight] = useState(65); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync queue from parent when initialQueue changes
  useEffect(() => {
    if (initialQueue.length > 0) {
      setQueue(initialQueue);
      setCurrentIndex(0);
    }
  }, [initialQueue]);

  const currentSong = queue[currentIndex];

  const handleSongEnd = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNextSong = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePreviousSong = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const removeSongFromQueue = (index: number) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    if (currentIndex >= newQueue.length && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const skipToSong = (index: number) => {
    if (index >= 0 && index < queue.length) {
      setCurrentIndex(index);
    }
  };

  // Vertical drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientY - rect.top) / rect.height) * 100;
      setPlayerHeight(Math.max(30, Math.min(85, pct)));
    };
    const handleUp = () => setIsDragging(false);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      {/* Player */}
      <div className="min-h-0 overflow-hidden" style={{ height: `${playerHeight}%` }}>
        {currentSong ? (
          <Player
            song={currentSong}
            onSongEnd={handleSongEnd}
            onNextSong={currentIndex < queue.length - 1 ? handleNextSong : undefined}
            onPreviousSong={currentIndex > 0 ? handlePreviousSong : undefined}
            compact={compact}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-purple-950 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center text-white/40 font-medium text-sm">
              No song playing
            </div>
            {/* Empty controls */}
            <div className="p-3 border-t border-white/10 bg-black/20 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 font-medium">0:00</span>
                <div className="flex-1 h-1 bg-white/15 rounded-full" />
                <span className="text-xs text-white/50 font-medium">0:00</span>
              </div>
              <div className="flex justify-center gap-3 items-center">
                <button disabled className="w-8 h-8 rounded-lg border border-white/20 text-white/40 text-xs cursor-not-allowed flex items-center justify-center opacity-40">
                  ⏮
                </button>
                <button disabled className="w-10 h-10 rounded-full border-2 border-white/30 text-white/50 text-sm cursor-not-allowed flex items-center justify-center opacity-40">
                  ▶
                </button>
                <button disabled className="w-8 h-8 rounded-lg border border-white/20 text-white/40 text-xs cursor-not-allowed flex items-center justify-center opacity-40">
                  ⏭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───── Vertical Drag Handle ───── */}
      <div
        onMouseDown={handleDragStart}
        className={`h-2 flex items-center justify-center cursor-row-resize shrink-0 group transition-colors ${isDragging ? "bg-primary/20" : "hover:bg-muted"
          }`}
      >
        <div className="w-10 h-1 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
      </div>

      {/* Queue Display */}
      <div className="flex-1 min-h-0 bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <h3 className="font-bold text-xs uppercase tracking-wide text-zinc-900">
            Queue ({queue.length})
          </h3>
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0">
          {queue.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-zinc-400 font-medium">
                Click a song to start playing
              </p>
            </div>
          ) : (
            queue.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className={`px-4 py-2.5 border-b border-zinc-100 transition-colors cursor-pointer ${index === currentIndex
                    ? "bg-primary/10 border-primary/30"
                    : "hover:bg-zinc-50"
                  }`}
                onClick={() => skipToSong(index)}
              >
                <div className="flex items-center gap-3">
                  {/* Queue Number / Playing indicator */}
                  <div className="text-xs font-semibold text-zinc-400 w-4 shrink-0 text-center">
                    {index === currentIndex ? "♪" : index + 1}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${index === currentIndex ? "text-primary" : "text-zinc-900"
                        }`}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSongFromQueue(index);
                    }}
                    className="text-xs text-zinc-400 hover:text-red-500 shrink-0 font-semibold px-1.5 py-0.5 hover:bg-red-50 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
