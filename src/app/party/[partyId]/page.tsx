"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePartySync } from "@/hooks/usePartySync";
import type { PartyStateUpdate } from "@/lib/types/party";

export default function PartyPage() {
  const params = useParams();
  const partyId = params.partyId as string;

  const [state, setState] = useState<PartyStateUpdate>({
    isPlaying: false,
    playbackPositionMs: 0,
    updatedAt: new Date().toISOString(),
    hostId: "",
  });

  const onStateUpdate = useCallback((update: PartyStateUpdate) => {
    setState(update);
  }, []);

  const { connected, broadcast } = usePartySync({
    partyId,
    onStateUpdate,
  });

  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    setInviteUrl(`${window.location.origin}/party/${partyId}`);
  }, [partyId]);

  function togglePlayback() {
    const next: PartyStateUpdate = {
      ...state,
      isPlaying: !state.isPlaying,
      updatedAt: new Date().toISOString(),
    };
    setState(next);
    broadcast(next);
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl text-center">
      <h1 className="text-2xl font-bold mb-4">Party Room</h1>

      <Badge variant={connected ? "default" : "destructive"} className="mb-4">
        {connected ? "Connected" : "Reconnecting..."}
      </Badge>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share this link to invite friends:
        </p>
        <code className="block p-2 bg-muted rounded text-sm break-all">{inviteUrl}</code>

        <Button onClick={() => navigator.clipboard.writeText(inviteUrl)}>
          Copy Invite Link
        </Button>

        <div className="pt-4">
          <Button size="lg" onClick={togglePlayback}>
            {state.isPlaying ? "Pause" : "Play"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Position: {Math.floor(state.playbackPositionMs / 1000)}s
          </p>
        </div>

        {/* TODO: Integrate wavesurfer.js karaoke player here */}
        {/* TODO: Lyric display synced to playback position */}
        {/* TODO: Participant count */}
      </div>
    </main>
  );
}
