/** LRC JSONB format — shared contract (Owner: Role 2 Backend/Data) */

export type LrcLine = {
  timeMs: number; // milliseconds from track start
  line: string; // lyric text for this timestamp
};

export type LrcData = LrcLine[];
