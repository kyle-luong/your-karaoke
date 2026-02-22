import { createServerSupabase } from "@/lib/supabase/server";
import ResizableLayout from "@/components/ResizableLayout";
import type { Song } from "@/lib/types/database";

export default async function KaraokePage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("songs").select("*").order("title");
  const songs: Song[] = (data as Song[]) ?? [];

  return <ResizableLayout songs={songs} />;
}
