'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic2,
  Music,
  Guitar,
  Zap,
  Heart,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import SongBrowser from '@/components/SongBrowser';
import Player from '@/components/player';
import SongQueue from '@/components/SongQueue';
import type { Song } from '@/lib/types/database';

const PLAYLISTS = [
  {
    name: 'Karaoke Classics',
    emoji: '🎤',
    gradient: 'from-pink-600 to-purple-900',
  },
  { name: 'Best Of', emoji: '⭐', gradient: 'from-orange-500 to-red-800' },
  {
    name: 'Legends of Rock',
    emoji: '🎸',
    gradient: 'from-blue-600 to-indigo-900',
  },
  {
    name: 'Country Classics',
    emoji: '🤠',
    gradient: 'from-amber-500 to-orange-800',
  },
];

const GENRES = [
  { name: 'Rap', icon: Mic2, color: 'text-blue-500' },
  { name: 'Pop', icon: Music, color: 'text-pink-500' },
  { name: 'Country', icon: Guitar, color: 'text-orange-500' },
  { name: 'Rock', icon: Zap, color: 'text-yellow-500' },
  { name: 'R&B', icon: Heart, color: 'text-red-500' },
];

interface ResizableLayoutProps {
  songs: Song[];
}

export default function ResizableLayout({ songs }: ResizableLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down on divider
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current;
      const containerRight = container.getBoundingClientRect().right;
      const newWidth = Math.max(250, Math.min(600, containerRight - e.clientX));

      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background"
    >
      {/* ───── Main Content ───── */}
      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0">
        <div className="mx-auto px-10 lg:px-14 py-10 space-y-16 max-w-6xl">
          {/* Page header + Start Lobby button */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
              >
                ← Back to Home
              </Link>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic mt-2">
                Discover
              </h1>
            </div>

            {/* Start Lobby button */}
            <Link
              href="/party"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wide hover:bg-primary/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0"
            >
              <Users className="size-4" />
              Start Lobby
            </Link>
          </div>

          {/* Promo banner */}
          <div className="rounded-2xl bg-gradient-to-r from-primary to-pink-400 p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-primary-foreground font-bold text-xl">
                Sing without limits.
              </p>
              <p className="text-primary-foreground/80 text-sm">
                Browse the full catalog and start flipping lyrics.
              </p>
            </div>
            <span className="text-6xl hidden sm:inline">🎤</span>
          </div>

          {/* Playlists */}
          <section className="space-y-5">
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                <Star className="size-5 text-primary" /> Playlists
              </h2>
              <span className="text-xs font-bold text-primary cursor-pointer hover:underline">
                COMING SOON →
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {PLAYLISTS.map((pl) => (
                <Card
                  key={pl.name}
                  className="overflow-hidden border-2 hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div
                    className={`h-32 bg-gradient-to-br ${pl.gradient} flex items-center justify-center`}
                  >
                    <span className="text-5xl">{pl.emoji}</span>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-bold text-xs uppercase tracking-wide">
                      {pl.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Genres */}
          <section className="space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
              <Music className="size-5 text-primary" /> Genres
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {GENRES.map((g) => (
                <Card
                  key={g.name}
                  className="hover:bg-accent cursor-pointer transition-all hover:-translate-y-1 group border-2"
                >
                  <CardContent className="p-5 flex flex-col items-center gap-3">
                    <g.icon
                      className={`size-9 ${g.color} group-hover:scale-110 transition-transform`}
                    />
                    <span className="font-bold uppercase text-xs tracking-widest">
                      {g.name}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Top Songs */}
          <section className="space-y-5">
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                <TrendingUp className="size-5 text-primary" /> Top
              </h2>
              <Badge variant="outline" className="text-xs">
                {songs.length} {songs.length === 1 ? 'song' : 'songs'}
              </Badge>
            </div>
            <SongBrowser songs={songs} />
          </section>
        </div>
      </main>

      {/* ───── Draggable Divider ───── */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 bg-zinc-300 hover:bg-primary cursor-col-resize transition-colors ${
          isResizing ? 'bg-primary' : ''
        }`}
      />

      {/* ───── Right Sidebar (Player + Queue) ───── */}
      <aside
        className="border-l border-zinc-200 bg-white overflow-y-auto flex flex-col gap-4 p-4 [&::-webkit-scrollbar]:w-0"
        style={{ width: `${sidebarWidth}px` }}
      >
        <Player compact={true} />
        <SongQueue />
      </aside>
    </div>
  );
}
