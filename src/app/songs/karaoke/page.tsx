import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mic2,
  Music,
  Guitar,
  Zap,
  Heart,
  Star,
  TrendingUp,
  ListMusic,
  Clock,
  PlusCircle,
} from "lucide-react";
import SongBrowser from "@/components/SongBrowser";
import PlayerSidebar from "@/components/PlayerSidebar";
import type { Song } from "@/lib/types/database";

// Placeholder data — will be dynamic later
const PLAYLISTS = [
  {
    name: "Karaoke Classics",
    emoji: "🎤",
    gradient: "from-pink-600 to-purple-900",
  },
  { name: "Best Of", emoji: "⭐", gradient: "from-orange-500 to-red-800" },
  {
    name: "Legends of Rock",
    emoji: "🎸",
    gradient: "from-blue-600 to-indigo-900",
  },
  {
    name: "Country Classics",
    emoji: "🤠",
    gradient: "from-amber-500 to-orange-800",
  },
];

const GENRES = [
  { name: "Rap", icon: Mic2, color: "text-blue-500" },
  { name: "Pop", icon: Music, color: "text-pink-500" },
  { name: "Country", icon: Guitar, color: "text-orange-500" },
  { name: "Rock", icon: Zap, color: "text-yellow-500" },
  { name: "R&B", icon: Heart, color: "text-red-500" },
];

const SIDEBAR_NAV = [
  { label: "Search", icon: Search, href: "#" },
  { label: "Discover", icon: Star, href: "/songs/karaoke", active: true },
  { label: "Playlists", icon: ListMusic, href: "#" },
  { label: "Genres", icon: Music, href: "#" },
  { label: "Top", icon: TrendingUp, href: "#" },
];

export default async function KaraokePage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("songs").select("*").order("title");
  const songs: Song[] = (data as Song[]) ?? [];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ───── Left Sidebar ───── */}
      <aside className="w-56 shrink-0 border-r bg-muted/30 hidden md:flex md:flex-col overflow-y-auto">
        {/* Main nav */}
        <nav className="p-4 space-y-1">
          {SIDEBAR_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* My Songs section */}
        <div className="px-4 mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            My Songs
          </p>
          <Link
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Heart className="size-4" /> Favorites
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Clock className="size-4" /> History
          </Link>
        </div>

        {/* My Playlists section */}
        <div className="px-4 mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            My Playlists
          </p>
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary hover:bg-accent transition-colors w-full">
            <PlusCircle className="size-4" /> Create a Playlist...
          </button>
        </div>
      </aside>

      {/* ───── Middle Content ───── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-12">
          {/* Page header */}
          <div>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:underline"
            >
              ← Home
            </Link>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic mt-1">
              Discover
            </h1>
          </div>

          {/* Promo banner */}
          <div className="rounded-2xl bg-linear-to-r from-primary to-pink-400 p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground font-bold text-lg">
                Sing without limits.
              </p>
              <p className="text-primary-foreground/80 text-sm">
                Browse the full catalog and start flipping lyrics.
              </p>
            </div>
            <span className="text-5xl">🎤</span>
          </div>

          {/* Playlists */}
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                <Star className="size-5 text-primary" /> Playlists
              </h2>
              <span className="text-xs font-bold text-primary">
                COMING SOON →
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PLAYLISTS.map((pl) => (
                <Card
                  key={pl.name}
                  className="overflow-hidden border-2 hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div
                    className={`h-28 bg-linear-to-br ${pl.gradient} flex items-center justify-center`}
                  >
                    <span className="text-4xl">{pl.emoji}</span>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-bold text-xs uppercase tracking-wide">
                      {pl.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Genres */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
              <Music className="size-5 text-primary" /> Genres
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {GENRES.map((g) => (
                <Card
                  key={g.name}
                  className="hover:bg-accent cursor-pointer transition-all hover:-translate-y-1 group border-2"
                >
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <g.icon
                      className={`size-8 ${g.color} group-hover:scale-110 transition-transform`}
                    />
                    <span className="font-bold uppercase text-xs tracking-widest">
                      {g.name}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Top Songs */}
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                <TrendingUp className="size-5 text-primary" /> Top
              </h2>
              <Badge variant="outline" className="text-xs">
                {songs.length} {songs.length === 1 ? "song" : "songs"}
              </Badge>
            </div>
            <SongBrowser songs={songs} />
          </section>
        </div>
      </main>

      {/* ───── Right Sidebar (Player / Queue) ───── */}
      <PlayerSidebar />
    </div>
  );
}
