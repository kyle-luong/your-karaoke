/** Database row types — mirrors supabase/schema.sql */

import type { LrcData } from "./lrc";

export type Song = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  duration_seconds: number;
  audio_url: string;
  lyrics_raw: string;
  lrc_data: LrcData;
  thumbnail_url: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  song_id: string;
  created_at: string;
};

export type Version = {
  id: string;
  project_id: string;
  type: "original" | "parody";
  lyrics_text: string;
  lrc_data: LrcData;
  created_at: string;
};

export type Report = {
  id: string;
  version_id: string;
  summary_text: string;
  narration_audio_url: string | null;
  transformation_metadata: TransformationMetadata;
  created_at: string;
};

export type TransformationMetadata = {
  changesCount: number;
  mainTheme: string;
  toneUsed: string;
  highlights: string[];
};

export type Party = {
  id: string;
  host_user_id: string;
  version_id: string;
  invite_code: string;
  is_active: boolean;
  created_at: string;
};

export type PartyState = {
  id: string;
  party_id: string;
  is_playing: boolean;
  playback_position_ms: number;
  updated_at: string;
};
