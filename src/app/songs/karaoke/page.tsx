import { createServerSupabase } from "@/lib/supabase/server";
import ResizableLayout from "@/components/ResizableLayout";
import type { Song, Version, Report } from "@/lib/types/database";

export default async function KaraokePage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("songs").select("*").order("title");
  const songs: Song[] = (data as Song[]) ?? [];

  // Count parody versions per song via projects → versions
  const remixCounts: Record<string, number> = {};

  if (songs.length > 0) {
    const songIds = songs.map((s) => s.id);
    const { data: projects } = await supabase
      .from("projects")
      .select("id, song_id")
      .in("song_id", songIds);

    if (projects && projects.length > 0) {
      const projectIds = projects.map((p: { id: string }) => p.id);
      const { data: versions } = await supabase
        .from("versions")
        .select("id, project_id")
        .in("project_id", projectIds)
        .eq("type", "parody");

      // Map project_id → song_id
      const projectToSong = new Map<string, string>();
      projects.forEach((p: { id: string; song_id: string }) =>
        projectToSong.set(p.id, p.song_id),
      );

      // Count versions per song
      (versions ?? []).forEach((v: { id: string; project_id: string }) => {
        const songId = projectToSong.get(v.project_id);
        if (songId) {
          remixCounts[songId] = (remixCounts[songId] ?? 0) + 1;
        }
      });
    }
  }

  // Build remix items (version + song + report) for Remix view
  type RemixItem = {
    version: Version;
    song: Song;
    report: Report | null;
    theme: string;
  };
  const remixItems: RemixItem[] = [];

  if (songs.length > 0) {
    const { data: versions } = await supabase
      .from("versions")
      .select("*, projects!inner(song_id)")
      .eq("type", "parody")
      .order("created_at", { ascending: false });

    const versionIds = (versions as Version[] | null)?.map((v) => v.id) ?? [];
    const { data: reports } = versionIds.length
      ? await supabase.from("reports").select("*").in("version_id", versionIds)
      : { data: [] };

    const reportMap = new Map<string, Report>();
    (reports as Report[] | null)?.forEach((r) =>
      reportMap.set(r.version_id, r),
    );

    const songMap = new Map<string, Song>();
    songs.forEach((s) => songMap.set(s.id, s));

    (
      versions as (Version & { projects: { song_id: string } })[] | null
    )?.forEach((v) => {
      const song = songMap.get(v.projects.song_id);
      if (!song) return;
      const report = reportMap.get(v.id) ?? null;
      const theme = report?.transformation_metadata?.mainTheme ?? "Remix";
      remixItems.push({ version: v, song, report, theme });
    });
  }

  return (
    <ResizableLayout
      songs={songs}
      remixCounts={remixCounts}
      remixItems={remixItems}
    />
  );
}
