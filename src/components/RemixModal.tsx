"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  themeOptions,
  toneOptions,
  audienceOptions,
  GenerateParodyResponse,
} from "@/lib/schemas/parody";
import {
  Sparkles,
  Loader2,
  Music,
  Download,
  CheckCircle2,
  Play,
} from "lucide-react";
import { toast } from "sonner";

interface RemixModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  originalLyrics: string;
}

type Step = "form" | "loading" | "result";

/** The /api/generate-parody response includes the DB-persisted versionId */
type ParodyResult = GenerateParodyResponse & {
  versionId?: string;
  projectId?: string;
};

export default function RemixModal({
  isOpen,
  onClose,
  songId,
  originalLyrics,
}: RemixModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [theme, setTheme] = useState<string>("food");
  const [tone, setTone] = useState<string>("silly");
  const [audience, setAudience] = useState<string>("teens");
  const [customIdea, setCustomIdea] = useState("");
  const [result, setResult] = useState<ParodyResult | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleGenerateLyrics = async () => {
    setStep("loading");
    try {
      const response = await fetch("/api/generate-parody", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId,
          originalLyrics,
          theme,
          tone,
          audience,
          customIdea: customIdea || undefined,
          isKidsMode: false,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("[RemixModal] API Error:", errData);
        throw new Error("Failed to generate lyrics");
      }

      const data = await response.json();
      setResult(data);
      setStep("result");
      toast.success("Lyrics generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate lyrics. Please try again.");
      setStep("form");
    }
  };

  const handleGenerateAudio = async () => {
    if (!result || !result.versionId) {
      toast.error("Generate lyrics first!");
      return;
    }
    setIsGeneratingAudio(true);
    try {
      toast.info("Audio generation started... this may take a minute.");

      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: result.versionId }),
      });

      if (!response.ok) throw new Error("Failed to generate audio");

      const data = await response.json();
      setAudioUrl(data.url);
      toast.success("MP3 generation complete!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate audio.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const reset = () => {
    setStep("form");
    setResult(null);
    setAudioUrl(null);
    setIsGeneratingAudio(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`${step === "result" ? "sm:max-w-2xl" : "sm:max-w-[500px]"} border-2 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            Remix this song
          </DialogTitle>
          <DialogDescription>
            Transform {originalLyrics.split("\n")[0].substring(0, 30)}... into a
            new masterpiece!
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="capitalize">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="capitalize">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger id="audience">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  {audienceOptions.map((opt) => (
                    <SelectItem key={opt} value={opt} className="capitalize">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom">Custom Idea (Optional)</Label>
              <Input
                id="custom"
                placeholder="e.g. A song about cats eating tacos..."
                value={customIdea}
                onChange={(e) => setCustomIdea(e.target.value)}
              />
            </div>

            <Button
              onClick={handleGenerateLyrics}
              className="w-full h-12 text-md font-bold uppercase tracking-wide gap-2"
            >
              Generate Lyrics
              <Sparkles className="size-4" />
            </Button>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="size-16 text-primary animate-spin relative" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold">
                Generative Magic in Progress...
              </h3>
              <p className="text-sm text-muted-foreground animate-pulse">
                Gemini is rewriting the lyrics for you
              </p>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="flex-1 min-h-0 flex flex-col gap-6 pt-2">
            {/* Improved Post-Generation Preview */}
            <div className="flex-1 overflow-hidden flex flex-col space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-3 bg-primary rounded-full" />
                Review your generated lyrics
              </p>
              <div className="flex-1 rounded-2xl border-2 border-border/60 bg-muted/30 p-6 font-mono text-sm shadow-inner group overflow-hidden">
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-2.5">
                  {result.parodyLrcLines.map((line, i) => (
                    <div
                      key={i}
                      className="flex gap-4 items-start group/line py-1 border-b border-border/5 last:border-0"
                    >
                      <span className="text-[11px] font-bold text-primary/40 mt-1 tabular-nums w-14 shrink-0 bg-primary/5 rounded px-2 py-0.5 text-center">
                        {Math.floor(line.timeMs / 60000)}:
                        {((line.timeMs % 60000) / 1000)
                          .toFixed(1)
                          .padStart(4, "0")}
                      </span>
                      <p className="text-foreground/80 group-hover/line:text-foreground transition-colors leading-relaxed">
                        {line.line}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <Button
                variant="outline"
                className="font-bold uppercase tracking-tight gap-2"
                onClick={reset}
              >
                Try Again
              </Button>
              {audioUrl ? (
                <Button
                  asChild
                  className="font-bold uppercase tracking-tight gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <a href={audioUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" />
                    Download MP3
                  </a>
                </Button>
              ) : (
                <Button
                  className="font-bold uppercase tracking-tight gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio}
                >
                  {isGeneratingAudio ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Music className="size-4" />
                  )}
                  {isGeneratingAudio ? "Generating..." : "Generate MP3"}
                </Button>
              )}
            </div>

            {result.versionId && (
              <Button
                asChild
                className="w-full font-bold uppercase tracking-tight gap-2"
              >
                <Link href={`/songs/karaoke?play=${songId}&versionId=${result.versionId}`}>
                  <Play className="size-4 fill-current" />
                  Play Now
                </Link>
              </Button>
            )}

            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 text-xs shrink-0">
              <CheckCircle2 className="size-4 shrink-0" />
              Lyrics have been saved to your collection!
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
