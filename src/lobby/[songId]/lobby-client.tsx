"use client";

import { useLobbySync } from "@/hooks/useLobbySync";
import { LobbyVideo } from "@/components/lobby-video";
import { Mic, Video, Play, LogOut } from "lucide-react";

export default function LobbyClient({ song, user, lobbyId }: any) {
  const { connected, members, isHost, startVideo } = useLobbySync({
    lobbyId,
    userId: user.id,
    nickname: user.email?.split("@")[0] || "Artist",
    hostId: user.id,
    onStateUpdate: (state) => console.log("Sync state:", state),
  });

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            Lobby: {song.title}
          </h1>
          <button onClick={startVideo} className="bg-primary text-black px-6 py-2 rounded-full font-bold flex items-center gap-2">
            <Video size={18} /> JOIN VIDEO
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <LobbyVideo 
              key={m.userId}
              stream={m.stream} 
              nickname={m.nickname} 
              isLocal={m.userId === user.id} 
            />
          ))}
        </div>

        {isHost && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2">
             <button className="bg-white text-black font-black px-12 py-4 rounded-full text-xl hover:scale-105 transition-all">
               START SESSION
             </button>
          </div>
        )}
      </div>
    </div>
  );
}