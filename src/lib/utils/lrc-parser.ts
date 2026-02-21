// helper function that takes in a lrc textfile and returns a list of lyrics and their timestamps
interface LyricLine {
  timestamp: number;
  text: string;
}

export default function parseLrcContent(content: string): LyricLine[] {
  return content
    .split('\n')
    .map(line => {
      const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (!match) return null;
      const timestamp = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
      const text = match[3].trim();
      return text ? { timestamp, text } : null;
    })
    .filter(Boolean) as LyricLine[];
};