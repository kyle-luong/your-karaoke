import type { Metadata } from "next";
import "./kids.css";
import { KidsNavbar } from "./kids-navbar";

export const metadata: Metadata = {
  title: "Lyric Lab Kids – Safe Karaoke for Children",
  description:
    "A kid-friendly karaoke experience with only child-safe songs. Sing along, have fun, stay safe!",
};

export default function KidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="kids-theme min-h-screen bg-background">
      <KidsNavbar />
      {children}
    </div>
  );
}
