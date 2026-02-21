/** Supabase Realtime Party State Payload — shared contract (Owner: Role 2 Backend/Data) */

export type PartyStateUpdate = {
  isPlaying: boolean;
  playbackPositionMs: number;
  updatedAt: string; // ISO8601
  hostId: string;
};
