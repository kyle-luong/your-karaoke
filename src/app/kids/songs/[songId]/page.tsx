/**
 * Kids song detail — thin wrapper around the main song detail page.
 *
 * Only difference: blocks access if the song is NOT child_safe.
 * Uses the exact same SongHero + SongVersions components.
 */
import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SongHero from "@/components/SongHero";
import SongVersions from "@/components/SongVersions";
import type { Song, Version, Report } from "@/lib/types/database";

interface PageProps {
  params: Promise<{ songId: string }>;
  searchParams?: Promise<{ version?: string }>;
}

export default async function KidsSongDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { songId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createServerSupabase();

  // Fetch the song — must be child_safe
  const { data: song } = await supabase
    .from("songs")
    .select("*")
    .eq("id", songId)
    .eq("is_child_safe", true)
    .single();

  if (!song) notFound();
  const typedSong = song as Song;

  // Fetch versions (same as main page)
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("song_id", songId);

  const projectIds = (projects ?? []).map((p: { id: string }) => p.id);
  let versionsWithReports: { version: Version; report: Report | null }[] = [];

  if (projectIds.length > 0) {
    const { data: versions } = await supabase
      .from("versions")
      .select("*")
      .in("project_id", projectIds)
      .eq("type", "parody")
      .order("created_at", { ascending: false });

    if (versions && versions.length > 0) {
      const versionIds = versions.map((v: Version) => v.id);
      const { data: reports } = await supabase
        .from("reports")
        .select("*")
        .in("version_id", versionIds);

      const reportMap = new Map<string, Report>();
      (reports ?? []).forEach((r: Report) => reportMap.set(r.version_id, r));

      versionsWithReports = versions.map((v: Version) => ({
        version: v,
        report: reportMap.get(v.id) ?? null,
      }));
    }
  }

  const lyricsLines = typedSong.lyrics_raw
    .split("\n")
    .filter((line) => line.trim());

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="bg-muted/20 border-b">
        <div className="max-w-5xl mx-auto px-10 lg:px-14 py-10">
          <Link
            href="/songs/karaoke"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-3" />
            Back to Discover
          </Link>
          <SongHero song={typedSong} originalLyrics={typedSong.lyrics_raw} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-10 lg:px-14 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section className="space-y-5">
            <h2 className="text-lg font-bold uppercase tracking-tight">
              Original Lyrics
            </h2>
            <div className="rounded-2xl border-2 border-border/60 bg-card p-6">
              <div className="space-y-2">
                {lyricsLines.map((line, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-lg font-bold uppercase tracking-tight">
              Modified Versions
            </h2>
            <SongVersions
              songTitle={typedSong.title}
              songId={typedSong.id}
              versions={versionsWithReports}
              initialVersionId={resolvedSearchParams?.version}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
