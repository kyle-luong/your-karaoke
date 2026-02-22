// helper function that takes in a lrc textfile and returns a list of lyrics and their timestamps
interface LyricLine {
  timeMs: number;
  line: string;
}

export default function parseLrcContent(content: string): LyricLine[] {
  return content
    .split('\n')
    .map(line => {
      const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (!match) return null;
      const timestampSeconds = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
      const timeMs = Math.round(timestampSeconds * 1000);
      const text = match[3].trim();
      return text ? { timeMs, line: text } : null;
    })
    .filter(Boolean) as LyricLine[];
};