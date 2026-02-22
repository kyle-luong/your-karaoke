import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LobbyClient from "./lobby-client";

export default async function LobbyPage({ params }: { params: { songId: string } }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Please login.</div>;

  const { data: song } = await supabase
    .from("songs")
    .select("*")
    .eq("id", params.songId)
    .single();

  if (!song) notFound();

  return (
    <LobbyClient 
      song={song} 
      user={user} 
      lobbyId={params.songId} 
    />
  );
}