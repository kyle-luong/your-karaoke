"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Version, Report } from "@/lib/types/database";

interface VersionModalProps {
    version: Version;
    report: Report | null;
    songTitle: string;
    onClose: () => void;
}

export default function VersionModal({
    version,
    report,
    songTitle,
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

    const theme = report?.transformation_metadata?.mainTheme ?? "Parody";
    const tone = report?.transformation_metadata?.toneUsed ?? null;
    const description =
        report?.summary_text ||
        version.lyrics_text.split("\n").filter((l) => l.trim()).slice(0, 5).join("\n");

    return (
        <div
            ref={overlayRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
            <div className="bg-card border-2 border-border rounded-2xl shadow-2xl max-w-lg w-full p-8 relative space-y-5 animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close"
                >
                    <X className="size-5" />
                </button>

                {/* Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-primary" />
                        <Badge variant="outline" className="text-xs">
                            {version.type}
                        </Badge>
                        {tone && (
                            <Badge className="text-xs bg-primary/10 text-primary border-none">
                                {tone}
                            </Badge>
                        )}
                    </div>

                    <h2 className="text-2xl font-black tracking-tight">
                        {theme}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Based on <span className="font-semibold text-foreground">{songTitle}</span>
                    </p>
                </div>

                {/* Description / lyrics preview */}
                <div className="bg-muted/40 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                        {description}
                    </p>
                </div>

                {/* Highlights */}
                {report?.transformation_metadata?.highlights &&
                    report.transformation_metadata.highlights.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Highlights
                            </p>
                            <ul className="space-y-1">
                                {report.transformation_metadata.highlights.map((h, i) => (
                                    <li
                                        key={i}
                                        className="text-sm text-muted-foreground flex items-start gap-2"
                                    >
                                        <span className="text-primary mt-0.5">•</span>
                                        {h}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                {/* Play Now button */}
                <Link
                    href="/songs/karaoke"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wide hover:bg-primary/90 transition-all shadow-lg"
                >
                    <Play className="size-5 fill-current" />
                    Play Now
                </Link>
            </div>
        </div>
    );
}
