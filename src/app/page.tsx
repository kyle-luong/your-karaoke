import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeActions } from "@/components/shared/home-actions";
import { Mic2, Music, Guitar,Zap, Heart, Disc, Sparkles } from "lucide-react";
import type { Song } from "@/lib/types/database";

const CATEGORIES = [
  { name: "Rap", icon: Mic2, color: "text-blue-500", route: "/categories/1" },
  { name: "Pop", icon: Music, color: "text-pink-500", route: "/categories/1"},
  { name: "Country", icon: Guitar, color: "text-orange-500", route: "/categories/1"},
  { name: "Rock", icon: Zap, color: "text-yellow-500", route: "/categories/1"},
  { name: "R&B", icon: Heart, color: "text-red-500", route: "/categories/1"},
];

export default async function LibraryPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: songs } = await supabase.from("songs").select("*").order("title");

  return (
    <main className="container mx-auto px-4 py-12 max-w-6xl space-y-16">
      {/* Hero Section */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center md:text-left">
          <Badge variant="outline" className="px-3 py-1 text-sm border-primary/50 text-primary">
            <Sparkles className="mr-2 size-3 inline" />
            AI Lyric Sanitizer
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
            SCRUB THE <span className="text-primary">DIRT.</span><br/>
            KEEP THE <span className="text-primary">BEAT.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg">
            Lyric Lab automatically cleans explicit tracks and helps you flip them into hilarious, kid-safe parodies.
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

      {/* Categories Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-tight">
          <Disc className="text-primary animate-spin-slow" /> Choose your style
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link href={cat.route} key={cat.name}>
              <Card className="hover:bg-accent cursor-pointer transition-all hover:-translate-y-1 group border-2">
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  <cat.icon className={`size-10 ${cat.color} group-hover:scale-110 transition-transform`} />
                  <span className="font-bold uppercase text-sm tracking-widest">{cat.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Song Grid Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Top Tracks to Flip</h2>
          <Link href="/library" className="text-sm font-bold text-primary hover:underline">
            VIEW ALL →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {(songs as Song[] | null)?.slice(0, 6).map((song) => (
            <SongCard key={song.id} song={song} />
          ))}

          {(!songs || songs.length === 0) && (
            <div className="col-span-full py-20 text-center border-4 border-dashed rounded-3xl bg-muted/30">
               <p className="text-muted-foreground text-xl font-medium">
                The Lab is empty!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Seed your database to start scrubbing songs.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SongCard({ song }: { song: Song }) {
  const durationMin = Math.floor(song.duration_seconds / 60);
  const durationSec = String(song.duration_seconds % 60).padStart(2, "0");

  return (
    <Link href={`/project/new?songId=${song.id}`}>
      <Card className="hover:shadow-2xl transition-all cursor-pointer h-full border-2 group overflow-hidden">
        <CardHeader className="p-0 relative">
          {song.thumbnail_url ? (
            <img
              src={song.thumbnail_url}
              alt={song.title}
              className="w-full h-44 object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-44 bg-secondary flex items-center justify-center text-5xl">
              💿
            </div>
          )}
          <div className="absolute bottom-2 right-2">
            <Badge className="bg-black/80 text-white font-mono border-none">
              {durationMin}:{durationSec}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-2 bg-card">
          <CardTitle className="text-lg font-bold line-clamp-1 uppercase italic">{song.title}</CardTitle>
          <p className="text-sm font-medium text-muted-foreground uppercase">{song.artist}</p>
        </CardContent>
      </Card>
    </Link>
  );
}