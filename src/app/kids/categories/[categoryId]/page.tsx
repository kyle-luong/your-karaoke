/**
 * Kids category page — thin wrapper around the main category page.
 *
 * Only difference: filters songs to child_safe = true.
 * Uses the exact same layout and components as the main categories page.
 */
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Music } from "lucide-react";
import type { Song } from "@/lib/types/database";

const GRADIENTS = [
  "from-pink-600 to-purple-900",
  "from-blue-600 to-indigo-900",
  "from-emerald-600 to-teal-900",
  "from-orange-500 to-red-800",
  "from-violet-600 to-fuchsia-900",
];

const CATEGORY_MAP: Record<
  string,
  { name: string; description: string; genres: string[] }
> = {
  rap: {
    name: "Rap & Hip-Hop",
    description: "The most energetic and powerful beats.",
    genres: ["Hip-Hop", "Rap"],
  },
  pop: {
    name: "Pop",
    description: "Catchy melodies and chart-topping hits.",
    genres: ["Pop"],
  },
  country: {
    name: "Country",
    description: "Stories, soul, and southern charm.",
    genres: ["Country"],
  },
  rock: {
    name: "Rock",
    description: "Loud guitars and raw energy.",
    genres: ["Rock"],
  },
  rnb: {
    name: "R&B",
    description: "Smooth grooves and soulful vibes.",
    genres: ["R&B"],
  },
};

function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function KidsCategoryPage({ params }: PageProps) {
  const { categoryId } = await params;
  const supabase = await createServerSupabase();

  const category = CATEGORY_MAP[categoryId];
  const categoryName = category?.name ?? "Category";
  const categoryDescription =
    category?.description ?? "Browse songs in this category.";

  let songs: Song[] = [];

  if (category) {
    const orFilter = category.genres.map((g) => `genre.ilike.%${g}%`).join(",");
    const { data } = await supabase
      .from("songs")
      .select("*")
      .eq("is_child_safe", true) // ← only child-safe songs
      .or(orFilter)
      .order("title");
    songs = (data as Song[]) ?? [];
  } else {
    const { data } = await supabase
      .from("songs")
      .select("*")
      .eq("is_child_safe", true) // ← only child-safe songs
      .order("title");
    songs = (data as Song[]) ?? [];
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative p-10 lg:p-14 border-b bg-gradient-to-br from-primary/20 to-pink-500/10">
        <Link
          href="/songs/karaoke"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-3" />
          Back to Discover
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          {categoryName}
        </h1>
        <p className="text-muted-foreground mt-2">{categoryDescription}</p>
      </div>

      <div className="max-w-4xl mx-auto px-10 lg:px-14 py-8">
        <div className="space-y-2">
          {songs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No kid-safe songs found in this category.
            </p>
          ) : (
            songs.map((song, index) => (
              <Link href={`/songs/${song.id}`} key={song.id}>
                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent transition-colors cursor-pointer group">
                  <div className="text-muted-foreground font-semibold min-w-8 text-center group-hover:text-foreground text-sm">
                    {index + 1}
                  </div>
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                    {song.thumbnail_url ? (
                      <img
                        src={song.thumbnail_url}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} flex items-center justify-center`}
                      >
                        <Music className="size-5 text-white/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {song.title}
                    </h3>
                    <p className="text-muted-foreground text-sm truncate">
                      {song.artist}
                    </p>
                  </div>
                  {song.genre && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {song.genre}
                    </span>
                  )}
                  <div className="text-muted-foreground text-sm font-medium min-w-12 text-right">
                    {formatDuration(song.duration_seconds)}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
