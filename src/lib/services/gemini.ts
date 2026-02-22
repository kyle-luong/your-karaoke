import { GoogleGenAI } from "@google/genai";
import type {
  GenerateParodyRequest,
  GenerateParodyResponse,
} from "@/lib/schemas/parody";
import { generateParodyResponseSchema } from "@/lib/schemas/parody";

const MOCK_RESPONSE: GenerateParodyResponse = {
  parodyLrcLines: [
    { timeMs: 0, line: "Happy burger to you" },
    { timeMs: 4000, line: "Happy burger to you" },
    { timeMs: 8000, line: "Happy burger dear ketchup" },
    { timeMs: 12000, line: "Happy burger to you" },
  ],
  summaryNarration:
    "This parody transforms a classic birthday song into a hilarious ode to burgers, replacing heartfelt wishes with condiment-themed humor.",
  transformationReport: {
    changesCount: 4,
    mainTheme: "food",
    toneUsed: "silly",
    highlights: ["birthday → burger", "dear friend → dear ketchup"],
  },
  generatedAt: new Date().toISOString(),
};

export async function generateParody(
  req: GenerateParodyRequest,
  lrcLines?: Array<{ timeMs: number; line: string }>,
): Promise<GenerateParodyResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[gemini] No GEMINI_API_KEY — returning mock response");
    return MOCK_RESPONSE;
  }

  const ai = new GoogleGenAI({ apiKey });

  const hasLrc = lrcLines && lrcLines.length > 0;

  const lrcBlock = hasLrc
    ? `\nThe lyrics are provided as timed LRC lines (timeMs in milliseconds + line text). You MUST rewrite EACH line individually, keeping the EXACT same number of lines and the EXACT same timeMs values. Return the rewritten lines in the "parodyLrcLines" array.\n\nOriginal LRC lines:\n${lrcLines.map((l) => `[${l.timeMs}] ${l.line}`).join("\n")}`
    : `\nOriginal lyrics:\n${req.originalLyrics}`;

  const prompt = `You are a parody lyric generator. Given original lyrics, rewrite them as a parody.

Theme: ${req.theme}${req.customIdea ? ` (idea: ${req.customIdea})` : ""}
Tone: ${req.tone}
Audience: ${req.audience}
${lrcBlock}

CRITICAL SYLLABLE RULE: Each rewritten line MUST have the EXACT same number of syllables as the corresponding original line. Count the syllables carefully before writing each line. The parody will be sung over the original melody, so syllable count must match precisely or the timing will be off.

For each line, follow this process:
1. Count the syllables in the original line.
2. Write a funny replacement matching the theme.
3. Count the syllables in your replacement.
4. If they don't match, revise until they do.

Be creative and funny while strictly maintaining syllable counts.

Respond ONLY with valid JSON matching this exact schema:
{
  "parodyLrcLines": [{"timeMs": number, "line": "rewritten line"}], // SAME count and timeMs values as input
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
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);
  return generateParodyResponseSchema.parse(parsed);
}
