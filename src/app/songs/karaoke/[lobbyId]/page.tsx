"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLobbySync } from "@/hooks/useLobbySync";
import { createClient } from "@/lib/supabase/client";
import type { PartyStateUpdate } from "@/lib/types/party";
import { Mic2, UserX, Play, Pause, Users, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { LobbyVideo } from "@/components/lobby-video";

export default function LobbyPage() {
    const params = useParams();
    const router = useRouter();
    const lobbyId = params.lobbyId as string;
    const supabase = createClient();

    const [userId, setUserId] = useState<string | null>(null);
    const [hostId, setHostId] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [state, setState] = useState<PartyStateUpdate>({
        isPlaying: false,
        playbackPositionMs: 0,
        updatedAt: new Date().toISOString(),
        hostId: "",
    });

    const onStateUpdate = useCallback((update: PartyStateUpdate) => {
        setState(update);
    }, []);

    const onKick = useCallback(() => {
        toast.error("You have been removed from the lobby");
        router.push("/songs/karaoke");
    }, [router]);

    // Handle user & lobby initialization
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Please login to join the lobby");
                router.push("/");
                return;
            }

            setUserId(user.id);

            // Fetch lobby to get hostId and invite_code
            const { data: party, error } = await supabase
                .from("parties")
                .select("host_user_id, invite_code")
                .eq("id", lobbyId)
                .single();

            if (error || !party) {
                toast.error("Lobby not found");
                router.push("/songs/karaoke");
                return;
            }

            setHostId(party.host_user_id);
            setInviteCode(party.invite_code);
            setLoading(false);
        }
        init();
    }, [lobbyId, router, supabase]);

    const { connected, members, isHost, broadcast, kickUser, startVideo, localStream } = useLobbySync({
        lobbyId,
        userId: userId || "",
        nickname: userId?.slice(0, 5) || "Guest", // Fallback for demo
        hostId: hostId || "",
        onStateUpdate,
        onKick,
    });

    const copyInviteLink = () => {
        if (!inviteCode) return;
        const url = `${window.location.origin}/j/${inviteCode}`;
        navigator.clipboard.writeText(url);
        toast.success("Invite link copied!");
    };

    if (loading) return <div className="p-8 text-center">Loading lobby...</div>;

    function handleTogglePlayback() {
        const next: PartyStateUpdate = {
            ...state,
            isPlaying: !state.isPlaying,
            updatedAt: new Date().toISOString(),
            hostId: userId || "",
        };
        setState(next);
        broadcast(next);
    }

    return (
        <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">

                {/* Main Player Area */}
                <div className="flex-1 space-y-6 w-full">
                    <Card className="border-4 border-primary/20 bg-card/50 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-3xl font-black italic uppercase">
                                    Lobby: {inviteCode || lobbyId.slice(0, 8)}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={connected ? "default" : "destructive"}>
                                        {connected ? "LIVE SYNC ACTIVE" : "RECONNECTING..."}
                                    </Badge>
                                    {inviteCode && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] font-mono bg-muted hover:bg-muted-foreground/10"
                                            onClick={copyInviteLink}
                                        >
                                            JOIN CODE: {inviteCode} 📋
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!localStream ? (
                                    <Button size="sm" variant="outline" onClick={startVideo} className="gap-2">
                                        <Video className="size-4" /> Join Video
                                    </Button>
                                ) : (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50 gap-2 p-1 px-2">
                                        <Video className="size-3" /> Camera On
                                    </Badge>
                                )}
                                {isHost && (
                                    <Badge variant="outline" className="border-primary text-primary font-bold">
                                        HOST
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="h-64 flex flex-col items-center justify-center space-y-6 border-t">
                            <div className="text-center space-y-2">
                                <Mic2 className={`size-16 mx-auto ${state.isPlaying ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                                <p className="text-xl font-bold uppercase tracking-widest text-muted-foreground">
                                    {state.isPlaying ? "Syncing Playback..." : "Ready to perform?"}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    size="lg"
                                    variant={isHost ? "default" : "secondary"}
                                    disabled={!isHost}
                                    onClick={handleTogglePlayback}
                                    className="rounded-full h-16 w-16 shadow-lg hover:shadow-primary/50 transition-all"
                                >
                                    {state.isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
                                </Button>
                                {!isHost && (
                                    <p className="text-xs text-muted-foreground italic max-w-[150px]">
                                        Wait for host to press play — you'll sync automatically!
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Video Grid Area */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {members.map((member) => (
                            <LobbyVideo
                                key={member.userId}
                                stream={member.stream}
                                nickname={member.nickname}
                                isLocal={member.userId === userId}
                            />
                        ))}

                        {members.length < 4 && !localStream && (
                            <div
                                onClick={startVideo}
                                className="aspect-square bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <VideoOff className="size-8 text-muted-foreground/50 mb-2" />
                                <span className="text-xs font-bold uppercase text-muted-foreground/50">Camera Off</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Members */}
                <div className="w-full md:w-80 space-y-4">
                    <Card className="h-full border-2 border-muted">
                        <CardHeader className="pb-2 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Users className="size-4" /> Participants ({members.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                            {members.map((member) => (
                                <div key={member.userId} className="flex items-center justify-between group p-2 rounded-lg hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-400'}`} />
                                        <span className="text-sm font-medium">{member.nickname} {member.userId === userId && "(You)"}</span>
                                        {member.role === "host" && <Badge className="text-[10px] h-4 bg-primary/20 text-primary border-none">HOST</Badge>}
                                    </div>
                                    {isHost && member.userId !== userId && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                if (confirm(`Kick ${member.nickname}?`)) {
                                                    kickUser(member.userId);
                                                }
                                            }}
                                        >
                                            <UserX className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            {process.env.NODE_ENV === "development" && (
                                <div className="mt-8 pt-4 border-t border-dashed border-muted-foreground/20 text-[10px] text-muted-foreground font-mono space-y-1">
                                    <p className="font-bold uppercase opacity-50">Debug info:</p>
                                    <p>Your ID: {userId}</p>
                                    <p>Host ID: {hostId}</p>
                                    <p className="text-primary italic">Copy "Your ID" to console to claim host!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
