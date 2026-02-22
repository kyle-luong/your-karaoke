"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { 
  Mic2, Music, Guitar, Zap, Heart, Search, Plus, Play, Users, 
  Sparkles, ShieldCheck, Copy, Check, Loader2, VideoOff 
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
  LayoutContextProvider
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

import type { Song } from "@/lib/types/database";
import type { Song as PlayerSong } from "@/components/player";

// ... (CONSTANTS AND toPlayerSong REMAIN THE SAME) ...
const GENRES = [
  { name: "All", icon: Music, color: "text-primary" },
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
    { onlySubscribed: false } 
  );

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-1.5 bg-black overflow-hidden">
      {tracks.map((track) => (
        <div 
          key={`${track.participant.identity}-${track.source}`} 
          className="relative rounded-lg overflow-hidden bg-muted/10 border border-white/5 flex items-center justify-center min-h-[120px]"
        >
          {isTrackReference(track) && (track.publication?.isSubscribed || track.participant.isLocal) ? (
            <VideoTrack trackRef={track} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-4 text-primary animate-spin" />
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Connecting...</p>
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
            controls={{ microphone: true, camera: true, screenShare: false, chat: false, settings: true }}
          />
        </div>
      </LayoutContextProvider>
    </LiveKitRoom>
  );
}

function toPlayerSong(song: Song): PlayerSong {
  const lyrics = song.lrc_data && Array.isArray(song.lrc_data)
    ? song.lrc_data.map((l) => ({ 
        timestamp: l.timeMs,
        text: l.line
      }))
    : undefined;

  return { 
    id: song.id, 
    title: song.title, 
    artist: song.artist, 
    audioUrl: song.audio_url, 
    lyrics 
  };
}

export default function ResizableLayout({ songs, remixCounts = {}, initialLobbyId, isGuest }: ResizableLayoutProps) {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const [activeGenre, setActiveGenre] = useState("All");
  const [search, setSearch] = useState("");
  const [lobbyActive, setLobbyActive] = useState(false);
  const [lobbyId, setLobbyId] = useState<string | null>(initialLobbyId || null);
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [queue, setQueue] = useState<PlayerSong[]>([]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (initialLobbyId) setLobbyActive(true); }, [initialLobbyId]);

  useEffect(() => {
    if (lobbyActive && lobbyId && !token) {
      const fetchToken = async () => {
        try {
          const participantName = isGuest ? `Guest-${Math.floor(Math.random()*1000)}` : `Host-${Math.floor(Math.random()*1000)}`;
          const resp = await fetch(`/api/get-participant-token?room=${lobbyId}&username=${participantName}`, {
            method: 'GET',
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          const data = await resp.json();
          setToken(data.token);
        } catch (e) { console.error(e); }
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

  const playSong = (song: Song) => { setQueue([toPlayerSong(song)]); };
  const addToQueue = (song: Song) => { setQueue((prev) => [...prev, toPlayerSong(song)]); };

  const filtered = songs.filter((s) => {
    if (activeGenre !== "All") {
      const genre = GENRES.find((g) => g.name === activeGenre);
      if (genre && "match" in genre) {
        const matches = (genre as { match: string[] }).match;
        if (!matches.some((m) => s.genre?.toLowerCase().includes(m.toLowerCase()))) return false;
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.title.toLowerCase().includes(q) && !s.artist.toLowerCase().includes(q)) return false;
    }
    return true;
  });

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

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background relative">
      {showConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card p-8 rounded-[32px] border border-border text-center max-w-sm">
            <h3 className="text-xl font-black uppercase italic mb-2">Start Lobby?</h3>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-2xl bg-muted font-bold text-xs uppercase">Cancel</button>
              <button onClick={confirmLobby} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <div className="shrink-0 border-b bg-background z-20 p-4 lg:p-6 pb-2 max-w-6xl mx-auto w-full">
          {!lobbyActive ? (
            <div className="flex justify-between items-center mb-4">
              <Link href="/" className="text-[10px] text-muted-foreground hover:underline uppercase font-bold tracking-tighter">← Back</Link>
              <button onClick={() => setShowConfirm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-[10px] uppercase shadow-md hover:scale-105 transition-transform">
                <Users className="size-3" /> Start Lobby
              </button>
            </div>
          ) : (
            <div className="bg-muted/30 p-3 rounded-[20px] border border-border mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">Live Stage</span>
                <button onClick={copyInvite} className="flex items-center gap-2 px-2 py-1 bg-background rounded-lg border border-border hover:bg-accent transition-all">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Invite</span>
                  {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-muted-foreground" />}
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

          <div className="space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {GENRES.map((g) => (
                <button key={g.name} onClick={() => setActiveGenre(g.name)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${activeGenre === g.name ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent text-muted-foreground"}`}>
                  <g.icon className="size-3" /> {g.name}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search songs..." className="w-full pl-9 pr-4 py-2 rounded-xl border bg-card text-xs outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pt-2 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
            {filtered.map((song:Song) => (
              <div key={song.id} className="group">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-sm mb-2">
                  <button onClick={() => playSong(song)} className="w-full h-full">
                    {song.thumbnail_url ? <img src={song.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-all" /> : <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`} />}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <Play className="size-6 text-white fill-white" />
                    </div>
                  </button>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs truncate uppercase tracking-tighter">{song.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase">{song.artist}</p>
                  </div>
                  <button onClick={() => addToQueue(song)} className="p-1 rounded-md hover:bg-accent text-muted-foreground"><Plus className="size-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div onMouseDown={() => setIsResizing(true)} className={`w-1 cursor-col-resize hover:bg-primary/50 transition-colors ${isResizing ? 'bg-primary/50' : 'bg-border'}`} />

      <aside className="border-l bg-card overflow-hidden flex flex-col shrink-0" style={{ width: `${sidebarWidth}px` }}>
        <QueuedPlayer initialQueue={queue} compact={true} />
      </aside>
    </div>
  );
}