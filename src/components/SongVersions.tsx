"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
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
  initialVersionId?: string;
}

// Client component that manages which version modal is open
export default function SongVersions({
  songTitle,
  songId,
  versions,
  initialVersionId,
}: SongVersionsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!initialVersionId || versions.length === 0) return;
    const idx = versions.findIndex((v) => v.version.id === initialVersionId);
    if (idx >= 0) setSelectedIndex(idx);
  }, [initialVersionId, versions]);

  const selected = selectedIndex !== null ? versions[selectedIndex] : null;

  return (
    <>
      {versions.length === 0 ? (
        // Empty state
        <div className="rounded-2xl border-2 border-dashed border-border/60 p-10 text-center space-y-4">
          <Sparkles className="size-10 text-muted-foreground/40 mx-auto" />
          <p className="font-semibold text-sm">No remixes yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Use the Remix button above to create a parody of this song.
          </p>
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
          songId={songId}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
