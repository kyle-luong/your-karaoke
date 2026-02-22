"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { Version, Report } from "@/lib/types/database";

interface VersionCardProps {
    version: Version;
    report: Report | null;
    onClick: () => void;
}

export default function VersionCard({ version, report, onClick }: VersionCardProps) {
    // Show first 3 lines of parody lyrics as a snippet
    const snippet = version.lyrics_text
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 3)
        .join(" / ");

    const theme = report?.transformation_metadata?.mainTheme ?? "Parody";
    const tone = report?.transformation_metadata?.toneUsed ?? null;

    return (
        <button
            onClick={onClick}
            className="w-full text-left group"
        >
            <div className="rounded-xl border-2 border-border/60 bg-card p-5 space-y-3 transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
                {/* Header row */}
                <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary shrink-0" />
                    <span className="font-bold text-sm uppercase tracking-wide">
                        {theme}
                    </span>
                    <Badge
                        variant="outline"
                        className="text-[10px] ml-auto"
                    >
                        {version.type}
                    </Badge>
                    {tone && (
                        <Badge className="text-[10px] bg-primary/10 text-primary border-none">
                            {tone}
                        </Badge>
                    )}
                </div>

                {/* Lyrics snippet */}
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {snippet || "No lyrics preview available"}
                </p>

                {/* Created date */}
                <p className="text-xs text-muted-foreground/60">
                    Created {new Date(version.created_at).toLocaleDateString()}
                </p>
            </div>
        </button>
    );
}
