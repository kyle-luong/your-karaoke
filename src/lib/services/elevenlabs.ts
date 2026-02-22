import { createAdminClient } from "@/lib/supabase/admin";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function generateNarration(
  text: string,
  versionId: string
): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    console.warn("[elevenlabs] Missing API key or voice ID — skipping narration");
    return null;
  }

  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!response.ok) {
    console.error("[elevenlabs] API error:", response.status);
    return null;
  }

  const audioBuffer = await response.arrayBuffer();
  const fileName = `${versionId}-${Date.now()}.mp3`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("narrations")
    .upload(fileName, audioBuffer, { contentType: "audio/mpeg" });

  if (error) {
    console.error("[elevenlabs] Storage upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("narrations").getPublicUrl(fileName);
  return data.publicUrl;
}
