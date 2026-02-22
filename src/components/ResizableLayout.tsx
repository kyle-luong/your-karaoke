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
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import QueuedPlayer from "@/components/QueuedPlayer";
import { toast } from "sonner";

import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  isTrackReference,
  ControlBar,
  RoomAudioRenderer,
  LayoutContextProvider,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

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

function StageVideo() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-1.5 bg-black overflow-hidden">
      {tracks.map((track) => (
        <div
          key={`${track.participant.identity}-${track.source}`}
          className="relative rounded-lg overflow-hidden bg-muted/10 border border-white/5 flex items-center justify-center min-h-[120px]"
        >
          {isTrackReference(track) &&
          (track.publication?.isSubscribed || track.participant.isLocal) ? (
            <VideoTrack
              trackRef={track}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-4 text-primary animate-spin" />
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                Connecting...
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VideoStage({ token }: { token: string }) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      audio={true}
      video={true}
      data-lk-theme="default"
      className="h-full flex flex-col"
    >
      <LayoutContextProvider>
        <RoomAudioRenderer />
        <StageVideo />
        <div className="border-t bg-background/80 backdrop-blur-md p-1">
          <ControlBar
            variation="minimal"
            controls={{
              microphone: true,
              camera: true,
              screenShare: false,
              chat: false,
              settings: true,
            }}
          />
        </div>
      </LayoutContextProvider>
    </LiveKitRoom>
  );
}

function toPlayerSong(song: Song): PlayerSong {
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
    audioUrl: item.report?.narration_audio_url || instrumentalUrl,
    lyrics: (item.version.lrc_data as any[]).map((l) => ({
      timeMs: l.timeMs,
      line: l.line,
    })),
  };
}


type RemixItem = {
  version: Version;
  song: Song;
  report: Report | null;
  theme: string;
};

interface ResizableLayoutProps {
  songs: Song[];
  remixCounts?: Record<string, number>;
  remixItems?: RemixItem[];
  initialLobbyId?: string;
  isGuest?: boolean;
}

export default function ResizableLayout({
  songs,
  remixCounts = {},
  remixItems = [],
  initialLobbyId,
  isGuest,
}: ResizableLayoutProps) {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);

  const [activeGenre, setActiveGenre] = useState("All");
  const [search, setSearch] = useState("");

  const [lobbyActive, setLobbyActive] = useState(false);
  const [lobbyId, setLobbyId] = useState<string | null>(
    initialLobbyId || null,
  );
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [queue, setQueue] = useState<PlayerSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialLobbyId) setLobbyActive(true);
  }, [initialLobbyId]);

  useEffect(() => {
    if (lobbyActive && lobbyId && !token) {
      const fetchToken = async () => {
        try {
          const participantName = isGuest
            ? `Guest-${Math.floor(Math.random() * 1000)}`
            : `Host-${Math.floor(Math.random() * 1000)}`;
          const resp = await fetch(
            `/api/get-participant-token?room=${lobbyId}&username=${participantName}`,
            {
              method: "GET",
              headers: { "ngrok-skip-browser-warning": "true" },
            },
          );
          const data = await resp.json();
          setToken(data.token);
        } catch (e) {
          console.error(e);
        }
      };
      fetchToken();
    }
  }, [lobbyActive, lobbyId, token, isGuest]);

  const confirmLobby = () => {
    const id = Math.random().toString(36).substring(7);
    setLobbyId(id);
    setLobbyActive(true);
    setShowConfirm(false);
  };

  const copyInvite = () => {
    if (lobbyId) {
      const inviteLink = `https://unsilicified-grimiest-rupert.ngrok-free.dev/party/${lobbyId}`;
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link Copied!");
    }
  };

  useEffect(() => {
    if (initialised) return;
    const playId = searchParams.get("play");
    const versionId = searchParams.get("versionId");

    async function initPlay() {
      if (!playId) {
        setInitialised(true);
        return;
      }

      if (versionId) {
        try {
          const supabase = createClient();
          const { data: version } = await supabase
            .from("versions")
            .select("*, reports(*)")
            .eq("id", versionId)
            .single();

          const { data: song } = await supabase
            .from("songs")
            .select("*")
            .eq("id", playId)
            .single();

          if (version && song) {
            const report = version.reports && version.reports[0];
            const instrumentalUrl = getInstrumentalUrl(song.title);
            const playerSong: PlayerSong = {
              id: song.id,
              title: song.title,
              artist: song.artist,
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

  const playSong = (song: Song) => {
    setQueue([toPlayerSong(song)]);
    setCurrentIndex(0);
  };

  const playRemix = (item: RemixItem) => {
    setQueue([toRemixPlayerSong(item)]);
    setCurrentIndex(0);
  };

  const addToQueue = (song: Song) => {
    const ps = toPlayerSong(song);
    setQueue((prev) => [...prev, ps]);
  };

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

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background relative"
    >
      {showConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card p-8 rounded-[32px] border border-border text-center max-w-sm">
            <h3 className="text-xl font-black uppercase italic mb-2">
              Start Lobby?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-muted font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                onClick={confirmLobby}
                className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="shrink-0 border-b bg-background z-20 p-4 lg:p-6 pb-2 space-y-4">
          {!lobbyActive ? (
            <div className="flex justify-between items-center">
              <Link
                href="/"
                className="text-[10px] text-muted-foreground hover:underline uppercase font-bold tracking-tighter"
              >
                ← Back
              </Link>
              <button
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-[10px] uppercase shadow-md hover:scale-105 transition-transform"
              >
                <Users className="size-3" /> Start Lobby
              </button>
            </div>
          ) : (
            <div className="bg-muted/30 p-3 rounded-[20px] border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">
                  Live Stage
                </span>
                <button
                  onClick={copyInvite}
                  className="flex items-center gap-2 px-2 py-1 bg-background rounded-lg border border-border hover:bg-accent transition-all"
                >
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">
                    Invite
                  </span>
                  {copied ? (
                    <Check size={10} className="text-emerald-500" />
                  ) : (
                    <Copy size={10} className="text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="h-[200px] bg-black rounded-xl overflow-hidden border border-border relative">
                {token === "" ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <Loader2 className="animate-spin text-primary" size={20} />
                  </div>
                ) : (
                  <VideoStage token={token} />
                )}
              </div>
            </div>
          )}

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

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pt-2">
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
                          onClick={() =>
                            setQueue((prev) => [
                              ...prev,
                              toRemixPlayerSong(item),
                            ])
                          }
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

                            <Badge className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-mono border-none px-1.5 py-0.5">
                              {formatDuration(song.duration_seconds)}
                            </Badge>

                            {isPlaying && (
                              <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] border-none">
                                ♪ Playing
                              </Badge>
                            )}

                            {!isPlaying && song.is_child_safe && (
                              <div className="absolute top-1.5 left-1.5">
                                <Badge className="bg-emerald-600 text-white text-[10px] font-bold border-none px-1.5 py-0.5 flex items-center gap-0.5">
                                  <ShieldCheck className="size-2.5" /> Safe
                                </Badge>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="size-5 text-black fill-black ml-0.5" />
                              </div>
                            </div>
                          </div>
                        </button>

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
      </div>

      <div
        onMouseDown={() => setIsResizing(true)}
        className={`w-1 hover:bg-primary/50 cursor-col-resize transition-colors ${
          isResizing ? "bg-primary/50" : "bg-border"
        }`}
      />

      <aside
        className="border-l bg-card overflow-hidden flex flex-col"
        style={{ width: `${sidebarWidth}px` }}
      >
        <QueuedPlayer initialQueue={queue} compact={true} />
      </aside>
    </div>
  );
}
