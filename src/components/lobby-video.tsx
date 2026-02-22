"use client";

import { useEffect, useRef } from "react";

type LobbyVideoProps = {
    stream?: MediaStream;
    nickname: string;
    isLocal?: boolean;
    muted?: boolean;
};

export function LobbyVideo({ stream, nickname, isLocal, muted }: LobbyVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="aspect-square bg-black rounded-2xl relative overflow-hidden group border-2 border-primary/20 shadow-xl">
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted || isLocal}
                    className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-4xl">👤</div>
                </div>
            )}

            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/50 backdrop-blur-sm p-1 px-2 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-white truncate max-w-[80%]">
                    {nickname} {isLocal && "(You)"}
                </span>
            </div>
        </div>
    );
}
