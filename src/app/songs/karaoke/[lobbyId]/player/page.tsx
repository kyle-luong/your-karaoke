"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ResizableLayout from "@/components/ResizableLayout";
import { Loader2, Mic2 } from "lucide-react";
import type { Song } from "@/lib/types/database";

export default function PartyPage() {
  const params = useParams();
  const partyId = params.partyId as string;
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [guestName, setGuestName] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadSongs() {
      try {
        const response = await fetch("/api/songs");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setSongs(data);
      } catch (e) {
        console.error("Failed to load songs", e);
      } finally {
        setLoading(false);
      }
    }
    loadSongs();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Setting the Stage...</h2>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black p-6">
        <div className="bg-card p-8 rounded-[32px] border border-border w-full max-w-sm text-center shadow-2xl">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic2 className="text-primary size-8" />
          </div>
          <h2 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">The Stage is Ready</h2>
          <p className="text-muted-foreground text-sm mb-8 font-medium">Enter a name to join the performance.</p>
          
          <input 
            type="text" 
            placeholder="Your Stage Name..."
            className="w-full bg-muted p-4 rounded-2xl mb-4 border-2 border-transparent focus:border-primary outline-none text-center font-bold text-lg transition-all"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guestName.length > 0 && setIsReady(true)}
          />
          
          <button 
            disabled={guestName.length === 0}
            onClick={() => setIsReady(true)}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase italic hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            Join Performance
          </button>
        </div>
      </div>
    );
  }

  return (
    <ResizableLayout 
      songs={songs} 
      initialLobbyId={partyId} 
      isGuest={true} 
    />
  );
}