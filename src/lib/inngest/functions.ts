import { inngest } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateParody } from "@/lib/services/gemini";

export const generateParodyJob = inngest.createFunction(
  { id: "generate-parody", name: "Generate Parody" },
  { event: "parody/generate" },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };
    const supabase = createAdminClient();

    // Get project + song
    const { data: project } = await step.run("fetch-project", async () => {
      const { data } = await supabase
        .from("projects")
        .select("*, songs(*)")
        .eq("id", projectId)
        .single();
      return data;
    });

    if (!project?.songs) throw new Error("Project or song not found");

    // Generate parody via Gemini
    const result = await step.run("call-gemini", async () => {
      return generateParody({
        songId: project.song_id,
        originalLyrics: project.songs.lyrics_raw,
        theme: "food", // TODO: pass from event data
        tone: "silly",
        audience: "teens",
      });
    });

    // Save parody version
    const { data: version } = await step.run("save-version", async () => {
      const { data } = await supabase
        .from("versions")
        .insert({
          project_id: projectId,
          type: "parody",
          lyrics_text: result.parodyLrcLines.map((l) => l.text).join("\n"),
          lrc_data: result.parodyLrcLines.map((l) => ({ timeMs: l.timestamp * 1000, line: l.text }))
        })
        .select()
        .single();
      return data;
    });

    // Save report
    await step.run("save-report", async () => {
      await supabase.from("reports").insert({
        version_id: version!.id,
        summary_text: result.summaryNarration,
        transformation_metadata: result.transformationReport,
      });
    });

    return { versionId: version!.id };
  }
);
