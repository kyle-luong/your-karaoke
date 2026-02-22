/** Gemini parody generation schemas — shared contract (Owner: Role 3 AI Integration) */

import { z } from "zod/v4";

// --- Request schema ---

export const themeOptions = [
  "food",
  "sports",
  "school",
  "office",
  "custom",
] as const;
export const toneOptions = [
  "silly",
  "sarcastic",
  "wholesome",
  "dramatic",
] as const;
export const audienceOptions = ["kids", "teens", "adults"] as const;

export const lrcLineSchema = z.object({
  timeMs: z.number(),
  line: z.string(),
});

export const generateParodyRequestSchema = z.object({
  songId: z.string().uuid(),
  originalLyrics: z.string().min(1),
  theme: z.enum(themeOptions),
  tone: z.enum(toneOptions),
  audience: z.enum(audienceOptions),
  customIdea: z.string().max(200).optional(),
  lrcLines: z.array(lrcLineSchema).optional(),
});

export type GenerateParodyRequest = z.infer<typeof generateParodyRequestSchema>;

// --- Response schema (what Gemini must return) ---

export const transformationReportSchema = z.object({
  changesCount: z.number().int().min(0),
  mainTheme: z.string(),
  toneUsed: z.string(),
  highlights: z.array(z.string()).min(2).max(4),
});

export const generateParodyResponseSchema = z.object({
  parodyLrcLines: z.array(lrcLineSchema),
  summaryNarration: z.string().max(300),
  transformationReport: transformationReportSchema,
  generatedAt: z.string().datetime(),
});

export type GenerateParodyResponse = z.infer<
  typeof generateParodyResponseSchema
>;
export type TransformationReport = z.infer<typeof transformationReportSchema>;
