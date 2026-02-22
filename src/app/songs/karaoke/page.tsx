import { createServerSupabase } from "@/lib/supabase/server";
import ResizableLayout from "@/components/ResizableLayout";
import type { Song } from "@/lib/types/database";

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
        projectToSong.set(p.id, p.song_id)
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

  return <ResizableLayout songs={songs} remixCounts={remixCounts} />;
}
