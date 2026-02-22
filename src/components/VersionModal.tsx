"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Version, Report } from "@/lib/types/database";

interface VersionModalProps {
    version: Version;
    report: Report | null;
    songTitle: string;
    songId: string;
    onClose: () => void;
}

export default function VersionModal({
    version,
    report,
    songTitle,
    songId,
    onClose,
}: VersionModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const router = useRouter();

    const handleGenerateMP3 = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch("/api/generate-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ versionId: version.id }),
            });

            if (!response.ok) throw new Error("Audio generation failed");

            // Refresh to get the new audio URL in the report
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Failed to generate MP3. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const theme = report?.transformation_metadata?.mainTheme ?? "Remix";
    const tone = report?.transformation_metadata?.toneUsed ?? null;
    const lyrics = version.lyrics_text;

    return (
        <div
            ref={overlayRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
            <div className="bg-card border-2 border-border rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col p-8 relative animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close"
                >
                    <X className="size-5" />
                </button>

                {/* Header */}
                <div className="space-y-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-primary" />
                        <Badge variant="outline" className="text-xs uppercase font-bold tracking-tighter">
                            Remix
                        </Badge>
                        {tone && (
                            <Badge className="text-xs bg-primary/10 text-primary border-none">
                                {tone}
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-3xl font-black tracking-tight leading-none">
                            {theme}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Remix of <span className="font-semibold text-foreground">{songTitle}</span>
                        </p>
                    </div>
                </div>

                {/* Full Lyrics Preview */}
                <div className="flex-1 min-h-0 flex flex-col space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 shrink-0">
                        <span className="w-1 h-3 bg-primary rounded-full" />
                        Remix Lyrics
                    </p>
                    <div className="flex-1 min-h-0 bg-muted/30 rounded-xl border border-border/50 p-5 overflow-y-auto font-mono text-sm shadow-inner group custom-scrollbar">
                        <p className="leading-relaxed whitespace-pre-line text-foreground/80 group-hover:text-foreground transition-colors">
                            {lyrics}
                        </p>
                    </div>
                </div>

                {/* Action Row */}
                <div className="flex flex-col gap-3 shrink-0">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Generate MP3 Button - Only if audio doesn't exist */}
                        {!report?.narration_audio_url ? (
                            <button
                                onClick={handleGenerateMP3}
                                disabled={isGenerating}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted hover:bg-muted-foreground/10 text-foreground font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50 min-w-0"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="size-3 shrink-0 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-4 shrink-0" />
                                        <span>Generate MP3</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/20">
                                <span>✓ MP3 Ready</span>
                            </div>
                        )}

                        <Link
                            href={`/songs/karaoke?play=${songId}&versionId=${version.id}`}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wide hover:bg-primary/90 transition-all shadow-lg"
                        >
                            <Play className="size-4 fill-current" />
                            Play Now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
