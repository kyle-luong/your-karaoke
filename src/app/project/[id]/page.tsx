"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { themeOptions, toneOptions, audienceOptions } from "@/lib/schemas/parody";
import type { GenerateParodyResponse } from "@/lib/schemas/parody";

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const isNew = projectId === "new";
  const songId = searchParams.get("songId");

  const [theme, setTheme] = useState<string>("");
  const [tone, setTone] = useState<string>("");
  const [audience, setAudience] = useState<string>("");
  const [customIdea, setCustomIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateParodyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [song, setSong] = useState<{ title: string; artist: string; lyrics_raw: string } | null>(null);

  // Fetch song details
  useEffect(() => {
    if (!songId) return;
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/songs?id=eq.${songId}&select=*`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    })
      .then((r) => r.json())
      .then((data) => data[0] && setSong(data[0]));
  }, [songId]);

  const canGenerate = theme && tone && audience && song;

  async function handleGenerate() {
    if (!canGenerate || !songId || !song) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-parody", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId,
          originalLyrics: song.lyrics_raw,
          theme,
          tone,
          audience,
          customIdea: customIdea || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Parody generation failed — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">
        {song ? `${song.title} — ${song.artist}` : "Loading..."}
      </h1>

      {/* Configurator */}
      {!result && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium mb-2">Theme</h2>
            <div className="flex flex-wrap gap-2">
              {themeOptions.map((t) => (
                <Badge
                  key={t}
                  variant={theme === t ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setTheme(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium mb-2">Tone</h2>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((t) => (
                <Badge
                  key={t}
                  variant={tone === t ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setTone(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium mb-2">Audience</h2>
            <div className="flex flex-wrap gap-2">
              {audienceOptions.map((a) => (
                <Badge
                  key={a}
                  variant={audience === a ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setAudience(a)}
                >
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          <Input
            placeholder="Custom idea (optional, max 200 chars)"
            value={customIdea}
            onChange={(e) => setCustomIdea(e.target.value.slice(0, 200))}
          />

          <Button onClick={handleGenerate} disabled={!canGenerate || loading}>
            {loading ? "Generating..." : "Generate Parody"}
          </Button>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Original</CardTitle></CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm">{song?.lyrics_raw}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Parody</CardTitle></CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm">{result.parodyLyrics}</pre>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Transformation Report</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Changes:</strong> {result.transformationReport.changesCount}</p>
              <p><strong>Theme:</strong> {result.transformationReport.mainTheme}</p>
              <p><strong>Tone:</strong> {result.transformationReport.toneUsed}</p>
              <div>
                <strong>Highlights:</strong>
                <ul className="list-disc list-inside">
                  {result.transformationReport.highlights.map((h, i) => (
                    <li key={i} className="text-sm">{h}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            {/* TODO: Start Karaoke button → navigate to karaoke player */}
            <Button variant="outline" onClick={() => setResult(null)}>Regenerate</Button>
            {/* TODO: Play AI Narration button */}
            {/* TODO: Start Party button */}
          </div>
        </div>
      )}
    </main>
  );
}
