'use client';

import { useEffect, useRef, useState } from 'react';
import parseLrcContent from "@/lib/utils/lrc-parser";

interface LyricLine {
  timestamp: number;
  text: string;
}

// const parseLrcContent = (content: string): LyricLine[] => {
//   return content
//     .split('\n')
//     .map(line => {
//       const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
//       if (!match) return null;
//       const timestamp = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
//       const text = match[3].trim();
//       return text ? { timestamp, text } : null;
//     })
//     .filter(Boolean) as LyricLine[];
// };

// 5 background color options
const BG_COLORS = [
  '#6B1B47', // Dark purple/magenta
  '#2D1B3D', // Deep purple
  '#1F3A5F', // Deep blue
  '#1B3A3A', // Deep teal
  '#3A1F1F', // Deep burgundy
];

const getRandomColor = () => BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [bgColor, setBgColor] = useState<string>('#6B1B47');
  const lyricsRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const lrcContent = await fetch('/demo/lrcs/i-wonder.txt').then(r => r.text());
        if (cancelled) return;
        if (audioRef.current) audioRef.current.src = '/demo/songs/i-wonder.mp3';
        setLyrics(parseLrcContent(lrcContent));
        setBgColor(getRandomColor());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  // Update active lyric index
  useEffect(() => {
    let idx = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (lyrics[i].timestamp <= currentTime) { idx = i; break; }
    }
    if (idx !== activeIndex) setActiveIndex(idx);
  }, [currentTime, lyrics]);

  // Scroll active line into view
  useEffect(() => {
    if (activeIndex >= 0 && lineRefs.current[activeIndex] && lyricsRef.current) {
      const container = lyricsRef.current;
      const line = lineRefs.current[activeIndex];
      const lineTop = line.offsetTop;
      const lineHeight = line.offsetHeight;
      const containerHeight = container.offsetHeight;
      container.scrollTo({
        top: lineTop - containerHeight / 3 + lineHeight / 2,
        behavior: 'smooth',
      });
    }
  }, [activeIndex]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value);
  };

  const fmt = (t: number) => {
    if (!isFinite(t)) return '0:00';
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .wrap {
          min-height: 100vh;
          background: ${bgColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          transition: background 0.4s ease;
        }

        .card {
          width: 360px;
          height: 620px;
          background: ${bgColor};
          border: none;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Lyrics scroll area */
        .lyrics {
          flex: 1;
          overflow-y: scroll;
          padding: 80px 32px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 18%,
            black 75%,
            transparent 100%
          );
        }
        .lyrics::-webkit-scrollbar { display: none; }

        .lyric-line {
          font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 42px;
          font-weight: 700;
          line-height: 1.25;
          color: rgba(240, 240, 240, 0.25);
          margin-bottom: 20px;
          cursor: pointer;
          transition: color 0.3s ease, transform 0.3s ease;
          transform-origin: left center;
          user-select: none;
          letter-spacing: -0.8px;
        }

        .lyric-line.active {
          color: #f0f0f0;
          transform: scale(1.02);
          text-shadow: 0 0 20px rgba(240, 240, 240, 0.3);
        }

        .lyric-line.near {
          color: rgba(240, 240, 240, 0.45);
        }

        .lyric-line:hover {
          color: rgba(240, 240, 240, 0.6);
        }

        /* Loading */
        .loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(240, 240, 240, 0.5);
          font-size: 12px;
          letter-spacing: 0.1em;
        }

        /* Controls */
        .controls {
          padding: 16px 20px 20px;
          border-top: 1px solid rgba(240, 240, 240, 0.1);
          background: ${bgColor};
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Progress */
        .progress-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .time {
          font-size: 10px;
          color: rgba(240, 240, 240, 0.4);
          letter-spacing: 0.05em;
          min-width: 30px;
        }
        .time:last-child { text-align: right; }

        .track {
          flex: 1;
          height: 2px;
          background: rgba(240, 240, 240, 0.15);
          border-radius: 1px;
          position: relative;
          cursor: pointer;
        }

        .track-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: rgba(240, 240, 240, 0.8);
          border-radius: 1px;
          pointer-events: none;
          transition: width 0.1s linear;
        }

        .track input[type=range] {
          position: absolute;
          inset: -6px 0;
          width: 100%;
          opacity: 0;
          cursor: pointer;
          height: 14px;
        }

        /* Play button row */
        .btn-row {
          display: flex;
          justify-content: center;
        }

        .play-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(240, 240, 240, 0.4);
          background: transparent;
          color: rgba(240, 240, 240, 0.9);
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, background 0.2s, color 0.2s;
        }

        .play-btn:hover {
          border-color: #f0f0f0;
          background: rgba(240, 240, 240, 0.1);
          color: #f0f0f0;
        }

        .play-btn:active {
          transform: scale(0.94);
        }
      `}</style>

      <audio ref={audioRef} crossOrigin="anonymous" />

      <div className="wrap">
        <div className="card">
          {isLoading ? (
            <div className="loading">loading</div>
          ) : (
            <div className="lyrics" ref={lyricsRef}>
              {lyrics.map((line, i) => (
                <div
                  key={i}
                  ref={el => { lineRefs.current[i] = el; }}
                  className={`lyric-line ${i === activeIndex ? 'active' : Math.abs(i - activeIndex) <= 2 ? 'near' : ''}`}
                  onClick={() => {
                    if (audioRef.current) audioRef.current.currentTime = line.timestamp;
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
          )}

          <div className="controls">
            <div className="progress-row">
              <span className="time">{fmt(currentTime)}</span>
              <div className="track">
                <div className="track-fill" style={{ width: `${progress}%` }} />
                <input type="range" min={0} max={duration || 0} value={currentTime} onChange={seek} step={0.1} />
              </div>
              <span className="time">{fmt(duration)}</span>
            </div>
            <div className="btn-row">
              <button className="play-btn" onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}