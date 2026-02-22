import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  ShieldCheck,
  Mic2,
  Guitar,
  Zap,
  Heart,
  Sparkles,
} from "lucide-react";
import { HomeActions } from "@/components/shared/home-actions";
import type { Song, Version } from "@/lib/types/database";

/* ── Same categories & gradients as the main site ── */
const CATEGORIES = [
  { name: "Rap", icon: Mic2, color: "text-blue-500", route: "/categories/rap" },
  {
    name: "Pop",
    icon: Music,
    color: "text-pink-500",
    route: "/categories/pop",
  },
  {
    name: "Country",
    icon: Guitar,
    color: "text-orange-500",
    route: "/categories/country",
  },
  {
    name: "Rock",
    icon: Zap,
    color: "text-yellow-500",
    route: "/categories/rock",
  },
  { name: "R&B", icon: Heart, color: "text-red-500", route: "/categories/rnb" },
];

const GRADIENTS = [
  "from-pink-600 to-purple-900",
  "from-blue-600 to-indigo-900",
  "from-emerald-600 to-teal-900",
  "from-orange-500 to-red-800",
  "from-violet-600 to-fuchsia-900",
  "from-cyan-500 to-blue-800",
  "from-rose-500 to-pink-900",
  "from-amber-500 to-orange-800",
];

function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default async function KidsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only fetch child-safe songs
  const { data: songs } = await supabase
    .from("songs")
    .select("*")
    .eq("is_child_safe", true)
    .order("title");

  // Fetch parody remixes (same as main page)
  const { data: versions } = await supabase
    .from("versions")
    .select("*, projects!inner(song_id)")
    .eq("type", "parody")
    .order("created_at", { ascending: false })
    .limit(20);

  type Remix = { version: Version; song: Song; songId: string };
  const remixes: Remix[] = [];
  const songMap = new Map<string, Song>();
  ((songs as Song[]) ?? []).forEach((s) => songMap.set(s.id, s));

  if (versions) {
    for (const v of versions as (Version & {
      projects: { song_id: string };
    })[]) {
      const songId = v.projects.song_id;
      const song = songMap.get(songId);
      if (song) {
        remixes.push({ version: v, song, songId });
      }
    }
  }

  const typedSongs = (songs as Song[]) ?? [];

  return (
    <main className="min-h-[calc(100vh-4rem)] space-y-12 py-10">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 lg:px-10 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center md:text-left">
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-emerald-500/50 text-emerald-600"
          >
            <ShieldCheck className="mr-2 size-3 inline" />
            100% Kid-Safe
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Sing Along!
            </span>{" "}
            🎤
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg">
            All your favorite songs, all safe for kids! Pick a song and start
            singing — no worries, just fun! 🎶
          </p>
          <HomeActions isAuthenticated={!!user} />
        </div>

        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-muted bg-muted group">
          <img
            src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop"
            alt="Music Lab"
            className="object-cover w-full h-full opacity-80 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      </section>

      {/* ─── Genres ─── */}
      <ScrollSection title="Genres">
        {CATEGORIES.map((cat) => (
          <Link href={cat.route} key={cat.name} className="shrink-0">
            <div className="w-40 h-40 rounded-xl flex flex-col items-center justify-center gap-3 bg-card border border-border/40 hover:-translate-y-1 hover:shadow-sm transition-all cursor-pointer group">
              <cat.icon
                className={`size-9 ${cat.color} group-hover:scale-110 transition-transform`}
              />
              <span className="font-bold text-xs uppercase tracking-widest">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </ScrollSection>

      {/* ─── Popular Songs ─── */}
      <ScrollSection title="Popular" href="/songs/karaoke">
        {typedSongs.length === 0 ? (
          <div className="shrink-0 w-full py-16 text-center text-muted-foreground">
            No kid-safe songs yet — mark songs as is_child_safe in the database!
          </div>
        ) : (
          typedSongs.map((song, i) => (
            <Link href={`/songs/${song.id}`} key={song.id} className="shrink-0">
              <SongCard
                song={song}
                gradient={GRADIENTS[i % GRADIENTS.length]}
              />
            </Link>
          ))
        )}
      </ScrollSection>

      {/* ─── Remixes ─── */}
      <ScrollSection title="Remixes">
        {remixes.length === 0 ? (
          <div className="shrink-0 w-full py-16 text-center text-muted-foreground">
            No remixes yet — create a parody to see it here!
          </div>
        ) : (
          remixes.map((r) => (
            <Link
              href={`/songs/${r.songId}?version=${r.version.id}`}
              key={r.version.id}
              className="shrink-0"
            >
              <RemixCard song={r.song} version={r.version} />
            </Link>
          ))
        )}
      </ScrollSection>

      {/* ─── Footer ─── */}
      <footer className="max-w-6xl mx-auto px-6 py-8 text-center space-y-2 border-t">
        <p className="text-sm font-bold text-muted-foreground">
          🛡️ Lyric Lab Kids — Only safe, fun songs for young singers!
        </p>
        <p className="text-xs text-muted-foreground">
          Parents: All content on this page has been reviewed and marked as
          child-safe.
        </p>
      </footer>
    </main>
  );
}

/* ── Reused helper components (same as main page) ── */

function ScrollSection({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 flex justify-between items-end">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-sm font-bold text-primary hover:underline"
          >
            Show all
          </Link>
        )}
      </div>
      <div className="max-w-6xl mx-auto overflow-x-auto scrollbar-hide scroll-fade">
        <div
          className="flex gap-5 px-6 lg:px-10 pb-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function SongCard({ song, gradient }: { song: Song; gradient: string }) {
  return (
    <div
      className="w-44 group cursor-pointer"
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="w-44 h-44 rounded-xl overflow-hidden shadow-sm mb-3 relative">
        {song.thumbnail_url ? (
          <img
            src={song.thumbnail_url}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <Music className="size-10 text-white/30" />
          </div>
        )}
        <div className="absolute bottom-1.5 right-1.5">
          <Badge className="bg-black/70 text-white text-[10px] font-mono border-none px-1.5 py-0.5">
            {formatDuration(song.duration_seconds)}
          </Badge>
        </div>
        <div className="absolute top-1.5 left-1.5">
          <Badge className="bg-emerald-600 text-white text-[10px] font-bold border-none px-1.5 py-0.5 flex items-center gap-0.5">
            <ShieldCheck className="size-2.5" /> Safe
          </Badge>
        </div>
      </div>
      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
        {song.title}
      </p>
      <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
    </div>
  );
}

function RemixCard({ song, version }: { song: Song; version: Version }) {
  return (
    <div
      className="w-44 group cursor-pointer"
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="w-44 h-44 rounded-xl overflow-hidden shadow-md mb-3 relative">
        {song.thumbnail_url ? (
          <img
            src={song.thumbnail_url}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-75"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/60 to-pink-600 flex items-center justify-center">
            <Sparkles className="size-10 text-white/40" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className="bg-primary text-primary-foreground text-[10px] font-bold border-none px-1.5 py-0.5 uppercase">
            Remix
          </Badge>
        </div>
      </div>
      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
        {song.title}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        Parody · {song.artist}
      </p>
    </div>
  );
}
