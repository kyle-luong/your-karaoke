/** Serialize lyric lines back to standard LRC format. Inverse of parseLrcContent. */

import type { LrcLine } from "@/lib/types/lrc";

export function serializeToLrc(lines: LrcLine[]): string {
  return lines
    .map((line) => {
      const totalSeconds = line.timeMs / 1000;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = (totalSeconds % 60).toFixed(2).padStart(5, "0");
      return `[${String(minutes).padStart(2, "0")}:${seconds}]${line.line}`;
    })
    .join("\n");
}
