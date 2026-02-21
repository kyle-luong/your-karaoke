import { GoogleGenAI } from "@google/genai";
import type { GenerateParodyRequest, GenerateParodyResponse } from "@/lib/schemas/parody";
import { generateParodyResponseSchema } from "@/lib/schemas/parody";

const MOCK_RESPONSE: GenerateParodyResponse = {
  parodyLyrics:
    "Happy burger to you\nHappy burger to you\nHappy burger dear ketchup\nHappy burger to you",
  summaryNarration:
    "This parody transforms a classic birthday song into a hilarious ode to burgers, replacing heartfelt wishes with condiment-themed humor.",
  transformationReport: {
    changesCount: 4,
    mainTheme: "food",
    toneUsed: "silly",
    highlights: [
      "birthday → burger",
      "dear friend → dear ketchup",
    ],
  },
  generatedAt: new Date().toISOString(),
};

export async function generateParody(
  req: GenerateParodyRequest
): Promise<GenerateParodyResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[gemini] No GEMINI_API_KEY — returning mock response");
    return MOCK_RESPONSE;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a parody lyric generator. Given original lyrics, rewrite them as a parody.

Theme: ${req.theme}${req.customIdea ? ` (idea: ${req.customIdea})` : ""}
Tone: ${req.tone}
Audience: ${req.audience}

Original lyrics:
${req.originalLyrics}

Respond ONLY with valid JSON matching this exact schema:
{
  "parodyLyrics": "string (the full rewritten lyrics)",
  "summaryNarration": "string (≤300 chars summary for voice narration)",
  "transformationReport": {
    "changesCount": number,
    "mainTheme": "string",
    "toneUsed": "string",
    "highlights": ["string", "string"] // 2-4 notable changed lines
  },
  "generatedAt": "ISO8601 timestamp"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);
  return generateParodyResponseSchema.parse(parsed);
}
