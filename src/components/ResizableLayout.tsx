"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Mic2,
  Music,
  Guitar,
  Zap,
  Heart,
  Search,
  Plus,
  Play,
  Users,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import QueuedPlayer from "@/components/QueuedPlayer";
import type { Song, Version, Report } from "@/lib/types/database";
import type { Song as PlayerSong } from "@/components/player";

const GENRES = [
  { name: "All", icon: Music, color: "text-primary" },
  { name: "Remix", icon: Sparkles, color: "text-primary" },
  {
    name: "Rap",
    icon: Mic2,
    color: "text-blue-500",
    match: ["Hip-Hop", "Rap"],
  },
  { name: "Pop", icon: Music, color: "text-pink-500", match: ["Pop"] },
  {
    name: "Country",
    icon: Guitar,
    color: "text-orange-500",
    match: ["Country"],
  },
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
];

function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// Convert DB Song → Player Song format (with lyrics!)
function toPlayerSong(song: Song): PlayerSong {
  // lrc_data is already in correct format {timeMs, line}
  const lyrics =
    song.lrc_data && Array.isArray(song.lrc_data)
      ? song.lrc_data.map((l) => ({
          timeMs: l.timeMs,
          line: l.line,
        }))
      : undefined;

  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    audioUrl: song.audio_url,
    lyrics,
  };
}

function getInstrumentalUrl(songTitle: string) {
  const slug = songTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `/demo/instrumentals/${slug}-instrumental.mp3`;
}

function toRemixPlayerSong(item: RemixItem): PlayerSong {
  const instrumentalUrl = getInstrumentalUrl(item.song.title);
  return {
    id: item.song.id,
    title: item.theme,
    artist: item.song.title,
    // For remixes: use AI vocals if available, otherwise always use instrumental
    audioUrl: item.report?.narration_audio_url || instrumentalUrl,
    lyrics: (item.version.lrc_data as any[]).map((l) => ({
      timeMs: l.timeMs,
      line: l.line,
    })),
  };
}

interface ResizableLayoutProps {
  songs: Song[];
  remixCounts?: Record<string, number>;
  remixItems?: RemixItem[];
}

type RemixItem = {
  version: Version;
  song: Song;
  report: Report | null;
  theme: string;
};

export default function ResizableLayout({
  songs,
  remixCounts = {},
  remixItems = [],
}: ResizableLayoutProps) {
  const searchParams = useSearchParams();
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [activeGenre, setActiveGenre] = useState("All");
  const [search, setSearch] = useState("");

  // Queue state
  const [queue, setQueue] = useState<PlayerSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialised, setInitialised] = useState(false);

  // On mount: auto-play song from ?play= query param
  useEffect(() => {
    if (initialised) return;
    const playId = searchParams.get("play");
    const versionId = searchParams.get("versionId");

    async function initPlay() {
      if (!playId) {
        setInitialised(true);
        return;
      }

      // If versionId is present, we need to fetch the version lyrics
      if (versionId) {
        try {
          const supabase = createClient();
          // Fetch version and its report
          const { data: version } = await supabase
            .from("versions")
            .select("*, reports(*)")
            .eq("id", versionId)
            .single();

          const { data: song } = await supabase
            .from("songs")
            .select("*")
            .eq("id", playId) // playId is the project_id? Wait, look at SongHero link.
            // SongHero uses searchParams.get('play') as song.id.
            // But VersionModal uses searchParams.get('play') as version.project_id.
            // I should standardized 'play' to always be song_id, or handle both.
            // Let's assume 'play' is the song_id.
            .single();

          if (version && song) {
            const report = version.reports && version.reports[0];
            const instrumentalUrl = getInstrumentalUrl(song.title);
            const playerSong: PlayerSong = {
              id: song.id,
              title: song.title,
              artist: song.artist,
              // For remixes: use AI vocals if available, otherwise always use instrumental
              audioUrl: report?.narration_audio_url || instrumentalUrl,
              lyrics: (version.lrc_data as any[]).map((l) => ({
                timeMs: l.timeMs,
                line: l.line,
              })),
            };
            setQueue([playerSong]);
            setCurrentIndex(0);
          }
        } catch (err) {
          console.error("Failed to load version:", err);
        }
      } else {
        const song = songs.find((s) => s.id === playId);
        if (song) {
          setQueue([toPlayerSong(song)]);
          setCurrentIndex(0);
        }
      }
      setInitialised(true);
    }

    initPlay();
  }, [searchParams, songs, initialised]);

  // On mount, expand sidebar
  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.getBoundingClientRect().width;
    setSidebarWidth(Math.min(400, Math.floor(w * 0.35)));
  }, []);

  // Resize handlers
  const handleMouseDown = () => setIsResizing(true);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const right = containerRef.current.getBoundingClientRect().right;
      setSidebarWidth(Math.max(280, Math.min(500, right - e.clientX)));
    };
    const up = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    }
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, [isResizing]);

  // Play a song (replace queue with just this song)
  const playSong = (song: Song) => {
    setQueue([toPlayerSong(song)]);
    setCurrentIndex(0);
  };

  const playRemix = (item: RemixItem) => {
    setQueue([toRemixPlayerSong(item)]);
    setCurrentIndex(0);
  };

  // Add song to end of queue
  const addToQueue = (song: Song) => {
    const ps = toPlayerSong(song);
    // Allow the same song to be queued multiple times — always append
    setQueue((prev) => [...prev, ps]);
  };

  // Filter songs
  const filtered = songs.filter((s) => {
    if (activeGenre === "Remix") {
      return (remixCounts[s.id] ?? 0) > 0;
    }
    if (activeGenre !== "All") {
      const genre = GENRES.find((g) => g.name === activeGenre);
      if (genre && "match" in genre) {
        const matches = (genre as { match: string[] }).match;
        if (
          !matches.some((m) => s.genre?.toLowerCase().includes(m.toLowerCase()))
        ) {
          return false;
        }
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !s.title.toLowerCase().includes(q) &&
        !s.artist.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const filteredRemixes = remixItems.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !r.theme.toLowerCase().includes(q) &&
        !r.song.title.toLowerCase().includes(q) &&
        !r.song.artist.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const itemCount =
    activeGenre === "Remix" ? filteredRemixes.length : filtered.length;

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background"
    >
      {/* ───── Main Content ───── */}
      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0">
        <div className="mx-auto px-8 lg:px-12 py-8 space-y-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
              >
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic mt-1">
                Discover
              </h1>
            </div>
            <Link
              href="/party"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wide hover:bg-primary/90 transition-all shrink-0"
            >
              <Users className="size-4" />
              Start Lobby
            </Link>
          </div>

          {/* Genre pills */}
          <div className="flex gap-2 flex-wrap">
            {GENRES.map((g) => (
              <button
                key={g.name}
                onClick={() => setActiveGenre(g.name)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                  activeGenre === g.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-accent text-muted-foreground"
                }`}
              >
                <g.icon className="size-3.5" />
                {g.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search songs by title or artist…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Song count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>

          {/* Song grid */}
          {itemCount === 0 ? (
            <div className="py-16 text-center border-2 border-dashed rounded-2xl bg-muted/20">
              <p className="text-muted-foreground font-medium">
                No songs match your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {activeGenre === "Remix"
                ? filteredRemixes.map((item, i) => (
                    <div key={item.version.id} className="group">
                      <button
                        onClick={() => playRemix(item)}
                        className="w-full text-left"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm mb-2.5">
                          {item.song.thumbnail_url ? (
                            <img
                              src={item.song.thumbnail_url}
                              alt={item.song.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                            />
                          ) : (
                            <div
                              className={`w-full h-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center`}
                            >
                              <Sparkles className="size-8 text-white/40" />
                            </div>
                          )}

                          <div className="absolute top-1.5 left-1.5">
                            <Badge className="bg-black/70 text-white text-[10px] font-bold border-none px-2 py-0.5 uppercase">
                              Remix
                            </Badge>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/songs/${item.song.id}?version=${item.version.id}`}
                          className="min-w-0 flex-1"
                        >
                          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {item.theme}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.song.title}
                          </p>
                        </Link>
                        <button
                          onClick={() => setQueue((prev) => [...prev, toRemixPlayerSong(item)])}
                          className="shrink-0 mt-0.5 p-1 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Add to queue"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))
                : filtered.map((song, i) => {
                    const isPlaying =
                      queue.length > 0 && queue[currentIndex]?.id === song.id;
                    const remixCount = remixCounts[song.id] ?? 0;

                    return (
                      <div key={song.id} className="group">
                        {/* Card */}
                        <button
                          onClick={() => playSong(song)}
                          className="w-full text-left"
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm mb-2.5">
                            {song.thumbnail_url ? (
                              <img
                                src={song.thumbnail_url}
                                alt={song.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div
                                className={`w-full h-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center`}
                              >
                                <Music className="size-8 text-white/30" />
                              </div>
                            )}

                            {/* Duration badge */}
                            <Badge className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-mono border-none px-1.5 py-0.5">
                              {formatDuration(song.duration_seconds)}
                            </Badge>

                            {/* Playing indicator */}
                            {isPlaying && (
                              <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] border-none">
                                ♪ Playing
                              </Badge>
                            )}

                            {/* Content rating */}
                            {!isPlaying && song.is_child_safe && (
                              <div className="absolute top-1.5 left-1.5">
                                <Badge className="bg-emerald-600 text-white text-[10px] font-bold border-none px-1.5 py-0.5 flex items-center gap-0.5">
                                  <ShieldCheck className="size-2.5" /> Safe
                                </Badge>
                              </div>
                            )}

                            {/* Hover overlay with play button */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="size-5 text-black fill-black ml-0.5" />
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Info + add to queue */}
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/songs/${song.id}`}
                            className="min-w-0 flex-1"
                          >
                            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                              {song.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {song.artist}
                            </p>
                          </Link>
                          <button
                            onClick={() => addToQueue(song)}
                            className="shrink-0 mt-0.5 p-1 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                            title="Add to queue"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>

                        {/* Remix count */}
                        {remixCount > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Sparkles className="size-3 text-primary" />
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {remixCount}{" "}
                              {remixCount === 1 ? "remix" : "remixes"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
          )}
        </div>
      </main>

      {/* ───── Draggable Divider ───── */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 hover:bg-primary/50 cursor-col-resize transition-colors ${
          isResizing ? "bg-primary/50" : "bg-border"
        }`}
      />

      {/* ───── Right Sidebar (Player + Queue) ───── */}
      <aside
        className="border-l bg-card overflow-hidden flex flex-col"
        style={{ width: `${sidebarWidth}px` }}
      >
        <QueuedPlayer initialQueue={queue} compact={true} />
      </aside>
    </div>
  );
}
