'use client';

import { useEffect, useRef, useState } from 'react';
import parseLrcContent from "@/lib/utils/lrc-parser";

interface LyricLine {
  timestamp: number;
  text: string;
}

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
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

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const toggleFullscreen = async () => {
    if (!wrapRef.current) return;
    try {
      if (!isFullscreen) {
        if (wrapRef.current.requestFullscreen) {
          await wrapRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreenchange event to detect when user presses Escape
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Fredoka:wght@500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .wrap {
          min-height: 100vh;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          transition: background 0.4s ease;
          position: relative;
        }

        .wrap.fullscreen {
          width: 100vw;
          height: 100vh;
          background: transparent;
        }

        .wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        .card {
          width: 360px;
          height: 360px;
          background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          backdrop-filter: blur(10px);
        }

        .card.fullscreen {
          width: 90vw;
          height: 90vh;
          max-width: 90vw;
          max-height: 90vh;
          border-radius: 40px;
          border-width: 4px;
        }

        /* Lyrics scroll area */
        .lyrics {
          flex: 1;
          overflow-y: scroll;
          padding: 30px 20px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 15%,
            black 70%,
            transparent 100%
          );
        }
        .lyrics::-webkit-scrollbar { display: none; }

        .card.fullscreen .lyrics {
          padding: 60px 50px;
        }

        .lyric-line {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.3;
          color: rgba(240, 240, 240, 0.25);
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          transform-origin: left center;
          user-select: none;
          letter-spacing: -0.2px;
          padding: 4px 0;
        }

        .lyric-line.active {
          color: #fff;
          font-size: 22px;
          font-weight: 700;
          transform: translateX(2px);
          background: linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 100%);
          padding: 6px 12px;
          border-radius: 6px;
        }

        .lyric-line.near {
          color: rgba(240, 240, 240, 0.35);
          font-size: 16px;
        }

        .lyric-line:hover {
          color: rgba(240, 240, 240, 0.6);
          transform: translateX(1px);
        }

        .card.fullscreen .lyric-line {
          font-size: 48px;
          margin-bottom: 24px;
          padding: 12px 0;
        }

        .card.fullscreen .lyric-line.active {
          font-size: 64px;
          padding: 16px 32px;
          border-radius: 12px;
        }

        .card.fullscreen .lyric-line.near {
          font-size: 40px;
        }

        /* Loading */
        .loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(240, 240, 240, 0.6);
          font-size: 13px;
          letter-spacing: 0.08em;
          font-weight: 500;
        }

        .card.fullscreen .loading {
          font-size: 36px;
        }

        /* Controls */
        .controls {
          padding: 12px 14px 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .card.fullscreen .controls {
          padding: 32px 40px 40px;
          gap: 24px;
        }

        /* Progress */
        .progress-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card.fullscreen .progress-row {
          gap: 20px;
        }

        .time {
          font-size: 9px;
          color: rgba(240, 240, 240, 0.6);
          letter-spacing: 0.05em;
          min-width: 26px;
          font-weight: 500;
        }
        .time:last-child { text-align: right; }

        .card.fullscreen .time {
          font-size: 24px;
          min-width: 80px;
        }

        .track {
          flex: 1;
          height: 3px;
          background: rgba(240, 240, 240, 0.15);
          border-radius: 2px;
          position: relative;
          cursor: pointer;
          overflow: hidden;
        }

        .card.fullscreen .track {
          height: 8px;
          border-radius: 4px;
        }

        .track-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: linear-gradient(90deg, #ff006e 0%, #ff006e 50%, rgba(255, 0, 110, 0.7) 100%);
          border-radius: 2px;
          pointer-events: none;
          transition: width 0.1s linear;
        }

        .card.fullscreen .track-fill {
          border-radius: 4px;
        }

        .track input[type=range] {
          position: absolute;
          inset: -6px 0;
          width: 100%;
          opacity: 0;
          cursor: pointer;
          height: 15px;
        }

        /* Button row */
        .btn-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          align-items: center;
        }

        .card.fullscreen .btn-row {
          gap: 30px;
        }

        .control-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: linear-gradient(135deg, rgba(255, 0, 110, 0.2) 0%, rgba(255, 100, 150, 0.1) 100%);
          color: rgba(240, 240, 240, 0.9);
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .control-btn:hover {
          border-color: rgba(255, 255, 255, 0.5);
          background: linear-gradient(135deg, rgba(255, 0, 110, 0.35) 0%, rgba(255, 100, 150, 0.25) 100%);
          color: #fff;
          transform: scale(1.05);
        }

        .control-btn:active {
          transform: scale(0.95);
        }

        .card.fullscreen .control-btn {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          font-size: 28px;
          border-width: 2px;
        }

        .card.fullscreen .control-btn:hover {
          transform: scale(1.08);
        }

        .card.fullscreen .control-btn:active {
          transform: scale(0.92);
        }

        .play-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.5);
          background: linear-gradient(135deg, rgba(255, 0, 110, 0.3) 0%, rgba(255, 100, 150, 0.2) 100%);
          color: rgba(240, 240, 240, 0.95);
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .play-btn:hover {
          border-color: #fff;
          background: linear-gradient(135deg, rgba(255, 0, 110, 0.5) 0%, rgba(255, 100, 150, 0.4) 100%);
          color: #fff;
          transform: scale(1.08);
        }

        .play-btn:active {
          transform: scale(0.96);
        }

        .card.fullscreen .play-btn {
          width: 100px;
          height: 100px;
          font-size: 42px;
          border-width: 3px;
        }

        .card.fullscreen .play-btn:hover {
          transform: scale(1.1);
        }

        .card.fullscreen .play-btn:active {
          transform: scale(0.92);
        }
      `}</style>

      <audio ref={audioRef} crossOrigin="anonymous" />

      <div className={`wrap ${isFullscreen ? 'fullscreen' : ''}`} ref={wrapRef}>
        <div className={`card ${isFullscreen ? 'fullscreen' : ''}`}>
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
              <button className="control-btn" onClick={() => skip(-5)} title="Rewind 5s">-5s</button>
              <button className="play-btn" onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="control-btn" onClick={() => skip(5)} title="Fast forward 5s">+5s</button>
              <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">⛶</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}