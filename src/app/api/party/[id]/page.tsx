"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Mic2, Video, Music, ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";

// LiveKit Imports
import { 
  LiveKitRoom, 
  VideoConference, 
} from '@livekit/components-react';
import '@livekit/components-styles';

export default function GuestPartyPage() {
  const { id } = useParams(); // Gets 'jp1bid' from the URL
  const router = useRouter();
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  // 1. Fetch Guest Token immediately on mount
  useEffect(() => {
    if (!id) return;

    const fetchGuestToken = async () => {
      try {
        // We identify them as "Guest_" plus a random string
        const username = `Guest_${Math.random().toString(36).substring(7)}`;
        const resp = await fetch(`/api/get-participant-token?room=${id}&username=${username}`);
        const data = await resp.json();
        
        if (data.token) {
          setToken(data.token);
        } else {
          throw new Error("No token received");
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to join the performance stage.");
      }
    };

    fetchGuestToken();
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Invite link copied!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black italic uppercase tracking-tighter">
                Live <span className="text-primary">Stage</span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Lobby ID: {id}
              </p>
            </div>
          </div>

          <button 
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-all shadow-lg"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Invite Others"}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-6xl aspect-video bg-black rounded-[32px] overflow-hidden border border-border shadow-2xl relative">
          
          {token === "" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-zinc-950 text-zinc-500">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-xs font-black uppercase tracking-[0.3em] italic animate-pulse">
                Entering Performance Room...
              </p>
            </div>
          ) : (
            <LiveKitRoom
              video={true}
              audio={true}
              token={'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzE3NjU5OTUsImlkZW50aXR5IjoiZ3Vlc3QiLCJpc3MiOiJBUEk0Z2Fpd2hLSlJNY1oiLCJuYmYiOjE3NzE3NTU5OTUsInN1YiI6Imd1ZXN0IiwidmlkZW8iOnsiY2FuUHVibGlzaCI6dHJ1ZSwiY2FuUHVibGlzaERhdGEiOnRydWUsImNhblN1YnNjcmliZSI6dHJ1ZSwicm9vbSI6Imx5cmljIGxhYiByb29tIiwicm9vbUpvaW4iOnRydWV9fQ.A0ecBvWrbh0lDDRop-XyVLL6-s7e3vawPaoebNVMi_g'}
              serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
              connect={true}
              data-lk-theme="default"
              className="h-full w-full"
              onDisconnected={() => {
                toast.error("Disconnected from stage");
                router.push('/');
              }}
            >
              <VideoConference />
            </LiveKitRoom>
          )}
        </div>

        <div className="mt-8 text-center max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 mb-4">
            <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Connection Encrypted</span>
          </div>
          <h2 className="text-xl font-bold mb-2">You're on the Guest List!</h2>
          <p className="text-sm text-muted-foreground">
            Your camera and mic are ready. Once you see the host, you can start the performance. 
            Use the controls at the bottom of the stage to mute or toggle video.
          </p>
        </div>
      </main>

      <footer className="py-6 flex justify-center opacity-30">
        <div className="flex items-center gap-2">
          <Music size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Duo Performance Stage</span>
        </div>
      </footer>
    </div>
  );
}