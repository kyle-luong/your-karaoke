"use client";

import { useEffect, useState } from "react";
import Player, { Song } from "./player";

const DEMO_SONGS: Song[] = [
  {
    id: "i-wonder",
    title: "I Wonder",
    artist: "Kanye West",
    audioUrl: "/demo/songs/i-wonder.mp3",
    lyricsUrl: "/demo/lrcs/i-wonder.txt",
  },
  {
    id: "humble",
    title: "Humble",
    artist: "Kendrick Lamar",
    audioUrl: "/demo/songs/humble.mp3",
    lyricsUrl: "/demo/lrcs/humble.txt",
  },
];

interface QueuedPlayerProps {
  initialQueue?: Song[];
  compact?: boolean;
}

export default function QueuedPlayer({
  initialQueue = DEMO_SONGS,
  compact = true,
}: QueuedPlayerProps) {
  const [queue, setQueue] = useState<Song[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const addSongToQueue = (song: Song) => {
    setQueue([...queue, song]);
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

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Player */}
      <div className="flex-1 min-h-0">
        {currentSong ? (
          <Player 
            song={currentSong} 
            onSongEnd={handleSongEnd}
            onNextSong={currentIndex < queue.length - 1 ? handleNextSong : undefined}
            onPreviousSong={currentIndex > 0 ? handlePreviousSong : undefined}
            compact={compact} 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-purple-950 border-2 border-white/15 rounded-2xl backdrop-blur-md flex flex-col overflow-hidden">
            {/* Empty lyrics area */}
            <div className="flex-1 flex items-center justify-center text-white/40 font-medium">
              No song playing
            </div>
            
            {/* Controls */}
            <div className="p-4 border-t border-white/15 bg-black/20 flex flex-col gap-2.5">
              {/* Progress bar (empty state) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60 font-medium min-w-fit">0:00</span>
                <div className="flex-1 h-1 bg-white/15 rounded-full" />
                <span className="text-xs text-white/60 font-medium min-w-fit">0:00</span>
              </div>
              
              {/* Buttons */}
              <div className="flex justify-center gap-3 items-center">
                <button 
                  disabled 
                  className="w-9 h-9 rounded-lg border border-white/30 bg-gradient-to-br from-pink-500/20 to-pink-600/10 text-white/50 text-sm cursor-not-allowed flex items-center justify-center font-semibold opacity-40 transition-all"
                  title="Previous song"
                >
                  ⏮
                </button>
                <button 
                  disabled 
                  className="w-11 h-11 rounded-full border-2 border-white/50 bg-gradient-to-br from-pink-500/30 to-pink-600/20 text-white/70 text-base cursor-not-allowed flex items-center justify-center font-semibold opacity-50 transition-all"
                >
                  ▶
                </button>
                <button 
                  disabled 
                  className="w-9 h-9 rounded-lg border border-white/30 bg-gradient-to-br from-pink-500/20 to-pink-600/10 text-white/50 text-sm cursor-not-allowed flex items-center justify-center font-semibold opacity-40 transition-all"
                  title="Next song"
                >
                  ⏭
                </button>
                <button 
                  disabled 
                  className="w-9 h-9 rounded-lg border border-white/30 bg-gradient-to-br from-pink-500/20 to-pink-600/10 text-white/50 text-sm cursor-not-allowed flex items-center justify-center font-semibold opacity-40 transition-all"
                  title="Fullscreen"
                >
                  ⛶
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Queue Display */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
          <h3 className="font-bold text-sm uppercase tracking-wide text-zinc-900">
            Queue ({queue.length})
          </h3>
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto max-h-48">
          {queue.map((song, index) => (
            <div
              key={song.id}
              className={`px-4 py-3 border-b border-zinc-100 transition-colors cursor-pointer ${
                index === currentIndex
                  ? "bg-primary/10 border-primary/30"
                  : "hover:bg-zinc-50"
              }`}
              onClick={() => skipToSong(index)}
            >
              <div className="flex items-start gap-3">
                {/* Queue Number */}
                <div className="text-xs font-semibold text-zinc-500 mt-0.5 w-5 flex-shrink-0">
                  {index === currentIndex ? "" : index + 1}
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      index === currentIndex
                        ? "text-primary"
                        : "text-zinc-900"
                    }`}
                  >
                    {song.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {song.artist}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSongFromQueue(index);
                  }}
                  className="text-xs text-zinc-500 hover:text-red-600 flex-shrink-0 font-semibold px-2 py-1 hover:bg-red-50 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
