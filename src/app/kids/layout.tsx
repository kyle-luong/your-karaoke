import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import "./kids.css";
import { KidsNavbar } from "./kids-navbar";

export const metadata: Metadata = {
  title: "Lyric Lab Kids – Safe Karaoke for Children",
  description:
    "A kid-friendly karaoke experience with only child-safe songs. Sing along, have fun, stay safe!",
};

export default async function KidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the logged-in user so we can pass it to the navbar
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="kids-theme min-h-screen bg-background">
      <KidsNavbar
        userEmail={user?.email}
        userImage={user?.user_metadata?.avatar_url}
      />
      {children}
    </div>
  );
}
