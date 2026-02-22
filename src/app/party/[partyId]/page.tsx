"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ResizableLayout from "@/components/ResizableLayout"; // Adjust path if needed
import { Loader2 } from "lucide-react";
import type { Song } from "@/lib/types/database";

export default function PartyPage() {
  const params = useParams();
  const partyId = params.partyId as string;
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch the same songs the host sees
  useEffect(() => {
    async function loadSongs() {
      try {
        const response = await fetch("/api/songs"); // Adjust to your actual songs API
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
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Entering the Stage...</h2>
      </div>
    );
  }

  // WE RENDER THE EXACT SAME COMPONENT AS THE HOST
  return (
    <ResizableLayout 
      songs={songs} 
      initialLobbyId={partyId} 
      isGuest={true} 
    />
  );
}