"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PartyStateUpdate } from "@/lib/types/party";
import type { RealtimeChannel } from "@supabase/supabase-js";

const DRIFT_THRESHOLD_MS = 500;
const POLL_INTERVAL_MS = 2000;

type UsePartySyncOptions = {
  partyId: string;
  onStateUpdate: (state: PartyStateUpdate) => void;
};

export function usePartySync({ partyId, onStateUpdate }: UsePartySyncOptions) {
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const broadcast = useCallback(
    (state: PartyStateUpdate) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "party_state",
        payload: state,
      });
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`party:${partyId}`);

    channel
      .on("broadcast", { event: "party_state" }, ({ payload }) => {
        onStateUpdate(payload as PartyStateUpdate);
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status !== "SUBSCRIBED") {
          // Start polling fallback
          if (!pollRef.current) {
            pollRef.current = setInterval(async () => {
              const { data } = await supabase
                .from("party_state")
                .select("*")
                .eq("party_id", partyId)
                .single();
              if (data) {
                onStateUpdate({
                  isPlaying: data.is_playing,
                  playbackPositionMs: data.playback_position_ms,
                  updatedAt: data.updated_at,
                  hostId: "",
                });
              }
            }, POLL_INTERVAL_MS);
          }
        } else if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [partyId, onStateUpdate]);

  return { connected, broadcast, DRIFT_THRESHOLD_MS };
}
