/** Serialize lyric lines back to standard LRC format. Inverse of parseLrcContent. */

interface LyricLine {
  timestamp: number;
  text: string;
}

export function serializeToLrc(lines: LyricLine[]): string {
  return lines
    .map((line) => {
      const minutes = Math.floor(line.timestamp / 60);
      const seconds = (line.timestamp % 60).toFixed(2).padStart(5, "0");
      return `[${String(minutes).padStart(2, "0")}:${seconds}]${line.text}`;
    })
    .join("\n");
}
