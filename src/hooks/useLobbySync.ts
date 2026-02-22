"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PartyStateUpdate } from "@/lib/types/party";
import type { RealtimeChannel } from "@supabase/supabase-js";

const DRIFT_THRESHOLD_MS = 500;

export type LobbyMember = {
    userId: string;
    nickname: string;
    role: "host" | "guest";
    isMuted: boolean;
    hasVideo: boolean;
    stream?: MediaStream;
};

type UseLobbySyncOptions = {
    lobbyId: string;
    userId: string;
    nickname: string;
    hostId: string;
    onStateUpdate: (state: PartyStateUpdate) => void;
    onKick?: () => void;
};

export function useLobbySync({
    lobbyId,
    userId,
    nickname,
    hostId,
    onStateUpdate,
    onKick,
}: UseLobbySyncOptions) {
    const [connected, setConnected] = useState(false);
    const [members, setMembers] = useState<LobbyMember[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

    const channelRef = useRef<RealtimeChannel | null>(null);
    const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
    const isHost = userId === hostId;

    // 1. WebRTC helpers (Stable with refs)
    const createPeerConnection = useCallback((targetUserId: string) => {
        if (peerConnections.current[targetUserId]) return peerConnections.current[targetUserId];

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal(targetUserId, { candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStreams((prev) => ({
                ...prev,
                [targetUserId]: event.streams[0],
            }));
        };

        if (localStream) {
            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
        }

        peerConnections.current[targetUserId] = pc;
        return pc;
    }, [localStream, userId]); // localStream is needed to add tracks to NEW connections

    // 2. Broadcast & Signaling
    const sendSignal = useCallback((targetUserId: string, signal: any) => {
        channelRef.current?.send({
            type: "broadcast",
            event: "video_signal",
            payload: { from: userId, to: targetUserId, signal },
        });
    }, [userId]);

    const broadcast = useCallback(
        (state: PartyStateUpdate) => {
            if (!isHost) return;
            channelRef.current?.send({
                type: "broadcast",
                event: "party_state",
                payload: state,
            });
        },
        [isHost]
    );

    const kickUser = useCallback(
        (targetUserId: string) => {
            if (!isHost) return;
            channelRef.current?.send({
                type: "broadcast",
                event: "kick_user",
                payload: { userId: targetUserId },
            });
        },
        [isHost]
    );

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            // Add tracks to all EXISTING connections
            Object.values(peerConnections.current).forEach((pc) => {
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            });

            // Update Presence to notify others we have video
            channelRef.current?.track({
                userId,
                nickname,
                hasVideo: true,
                isMuted: false,
            });
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    // 3. Stable Channel Effect
    useEffect(() => {
        if (!userId || !lobbyId) return;

        const supabase = createClient();
        const channel = supabase.channel(`lobby:${lobbyId}`, {
            config: { presence: { key: userId } },
        });

        channel
            .on("broadcast", { event: "party_state" }, ({ payload }) => {
                if (!isHost) onStateUpdate(payload as PartyStateUpdate);
            })
            .on("broadcast", { event: "kick_user" }, ({ payload }) => {
                if (payload.userId === userId) onKick?.();
            })
            .on("broadcast", { event: "video_signal" }, async ({ payload }) => {
                if (payload.to !== userId) return;
                const pc = createPeerConnection(payload.from);

                if (payload.signal.sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.signal.sdp));
                    if (payload.signal.sdp.type === "offer") {
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        sendSignal(payload.from, { sdp: answer });
                    }
                } else if (payload.signal.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.signal.candidate));
                }
            })
            .on("presence", { event: "sync" }, () => {
                const presenceState = channel.presenceState();

                // Deduplicate members by userId
                const uniqueMembers = new Map<string, LobbyMember>();

                Object.values(presenceState).flat().forEach((p: any) => {
                    if (!uniqueMembers.has(p.userId)) {
                        uniqueMembers.set(p.userId, {
                            userId: p.userId,
                            nickname: p.nickname,
                            role: p.userId === hostId ? "host" : "guest",
                            isMuted: p.isMuted,
                            hasVideo: p.hasVideo,
                            stream: p.userId === userId ? localStream : remoteStreams[p.userId],
                        });
                    }
                });

                const memberList = Array.from(uniqueMembers.values());

                // Initiate connections to new peers
                memberList.forEach(m => {
                    if (m.userId !== userId && !peerConnections.current[m.userId]) {
                        const pc = createPeerConnection(m.userId);
                        pc.createOffer().then(async (offer) => {
                            await pc.setLocalDescription(offer);
                            sendSignal(m.userId, { sdp: offer });
                        });
                    }
                });

                setMembers(memberList);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    setConnected(true);
                    await channel.track({ userId, nickname, hasVideo: false, isMuted: false });
                } else {
                    setConnected(false);
                }
            });

        channelRef.current = channel;
        return () => { channel.unsubscribe(); };
    }, [lobbyId, userId, hostId, isHost, onStateUpdate, onKick, createPeerConnection, sendSignal]);
    // Note: localStream/remoteStreams are EXCLUDED from dependencies to prevent resubscribe loop.
    // They are accessed via closures in the on("presence") handler which is fine because 
    // Presence triggers frequently.

    // 4. Update member streams when localStream or remoteStreams change, without resubscribing
    useEffect(() => {
        setMembers(prev => prev.map(m => ({
            ...m,
            stream: m.userId === userId ? localStream : remoteStreams[m.userId]
        })));
    }, [localStream, remoteStreams, userId]);

    return {
        connected,
        members,
        localStream,
        isHost,
        broadcast,
        kickUser,
        startVideo,
        DRIFT_THRESHOLD_MS
    };
}

