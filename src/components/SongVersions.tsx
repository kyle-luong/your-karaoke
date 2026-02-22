"use client";

import { useState } from "react";
import { Sparkles, PlusCircle } from "lucide-react";
import Link from "next/link";
import VersionCard from "./VersionCard";
import VersionModal from "./VersionModal";
import type { Version, Report } from "@/lib/types/database";

interface VersionWithReport {
    version: Version;
    report: Report | null;
}

interface SongVersionsProps {
    songTitle: string;
    songId: string;
    versions: VersionWithReport[];
}

// Client component that manages which version modal is open
export default function SongVersions({ songTitle, songId, versions }: SongVersionsProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const selected = selectedIndex !== null ? versions[selectedIndex] : null;

    return (
        <>
            {versions.length === 0 ? (
                // Empty state
                <div className="rounded-2xl border-2 border-dashed border-border/60 p-10 text-center space-y-4">
                    <Sparkles className="size-10 text-muted-foreground/40 mx-auto" />
                    <p className="font-semibold text-sm">No modified versions yet</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Create a parody, kid-safe version, or any fun remix of this song.
                    </p>
                    <Link
                        href={`/project/new?songId=${songId}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wide hover:bg-primary/90 transition-all"
                    >
                        <PlusCircle className="size-4" />
                        Create Parody
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {versions.map((v, i) => (
                        <VersionCard
                            key={v.version.id}
                            version={v.version}
                            report={v.report}
                            onClick={() => setSelectedIndex(i)}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            {selected && (
                <VersionModal
                    version={selected.version}
                    report={selected.report}
                    songTitle={songTitle}
                    onClose={() => setSelectedIndex(null)}
                />
            )}
        </>
    );
}
