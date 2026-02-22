import { NextResponse } from "next/server";
import { generateNarration } from "@/lib/services/elevenlabs";

export async function POST(request: Request) {
  const { text, versionId } = await request.json();

  if (!text || !versionId) {
    return NextResponse.json({ error: "text and versionId required" }, { status: 400 });
  }

  const narrationAudioUrl = await generateNarration(text, versionId);

  if (!narrationAudioUrl) {
    return NextResponse.json({ error: "Narration unavailable" }, { status: 503 });
  }

  return NextResponse.json({ narrationAudioUrl });
}
