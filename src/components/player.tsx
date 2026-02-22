"use client";

import { useEffect, useRef, useState } from "react";
import parseLrcContent from "@/lib/utils/lrc-parser";
import parseTitle from "@/lib/utils/song-title-parser";

interface LyricLine {
  timeMs: number;
  line: string;
}

const BG_COLORS = [
  "#6B1B47",
  "#2D1B3D",
  "#1F3A5F",
  "#1B3A3A",
  "#3A1F1F",
];

const getRandomColor = () =>
  BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];

export interface Song {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  lyricsUrl?: string;
  lyrics?: Array<{ timeMs: number; line: string }>;
}

interface PlayerProps {
  song?: Song;
  onSongEnd?: () => void;
  onNextSong?: () => void;
  onPreviousSong?: () => void;
  lyrics?: Array<{ timeMs: number; line: string }>;
  compact?: boolean;
  audioUrl?: string; // Standardize/compatibility
}

export default function Player({ song, onSongEnd, onNextSong, onPreviousSong, lyrics: propLyrics, compact = true, audioUrl }: PlayerProps = {}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [bgColor, setBgColor] = useState<string>('#6B1B47');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    setIsKaraokeMode(false);

    if (propLyrics && propLyrics.length > 0) {
      setLyrics(propLyrics);
      if (song?.audioUrl && audioRef.current) {
        audioRef.current.src = song.audioUrl;
      }
      setBgColor(getRandomColor());
      setIsLoading(false);
      return;
    }

    if (song?.lyrics && song.lyrics.length > 0) {
      setLyrics(song.lyrics);
      if (song.audioUrl && audioRef.current) {
        audioRef.current.src = song.audioUrl;
      }
      setBgColor(getRandomColor());
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        if (song?.lyricsUrl) {
          const lrcContent = await fetch(song.lyricsUrl).then((r) => r.text());
          if (cancelled) return;
          if (song.audioUrl && audioRef.current) {
            audioRef.current.src = song.audioUrl;
          }
          setLyrics(parseLrcContent(lrcContent));
        } else if ((song?.audioUrl || audioUrl) && audioRef.current) {
          audioRef.current.src = song?.audioUrl || audioUrl || "";
        }
        setBgColor(getRandomColor());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [song, propLyrics, audioUrl]);

  // Autoplay next song when it changes
  useEffect(() => {
    if (song && audioRef.current && !isLoading) {
      audioRef.current.play().catch(() => { });
    }
  }, [song, isLoading]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (onSongEnd) onSongEnd();
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [onSongEnd]);

  useEffect(() => {
    let idx = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      const lineTimestamp = lyrics[i].timeMs / 1000;
      if (lineTimestamp <= currentTime) {
        idx = i;
        break;
      }
    }
    if (idx !== activeIndex) setActiveIndex(idx);
  }, [currentTime, lyrics]);

  useEffect(() => {
    if (
      activeIndex >= 0 &&
      lineRefs.current[activeIndex] &&
      lyricsRef.current
    ) {
      const container = lyricsRef.current;
      const line = lineRefs.current[activeIndex];
      const lineTop = line.offsetTop;
      const lineHeight = line.offsetHeight;
      const containerHeight = container.offsetHeight;
      container.scrollTo({
        top: lineTop - containerHeight / 3 + lineHeight / 2,
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => { });
    } else {
      audio.pause();
    }
  };

  const toggleKaraoke = async () => {
    const audio = audioRef.current;
    if (!audio || !song) return;
    const nextKaraoke = !isKaraokeMode;
    setIsKaraokeMode(nextKaraoke);

    const prevTime = audio.currentTime || 0;
    // Pause now and mark as not playing
    audio.pause();
    setIsPlaying(false);

    const onLoaded = () => {
      try {
        if (isFinite(prevTime) && prevTime >= 0 && prevTime <= (audio.duration || Infinity)) {
          audio.currentTime = prevTime;
        }
      } catch (err) {
        // ignore seeking errors
      }
      audio.pause();
      setIsPlaying(false);
      audio.removeEventListener('loadedmetadata', onLoaded);
    };

    audio.addEventListener('loadedmetadata', onLoaded);

    if (nextKaraoke) {
      const titleSlug = parseTitle(song.title);
      const artistSlug = parseTitle(song.artist);

      const primaryUrl = `/demo/instrumentals/${titleSlug}-instrumental.mp3`;
      const fallbackUrl = `/demo/instrumentals/${artistSlug}-instrumental.mp3`;

      const res = await fetch(primaryUrl, { method: 'HEAD' });
      const instrumentalUrl = res.ok ? primaryUrl : fallbackUrl;
      audio.src = instrumentalUrl;
    } else {
      audio.src = song.audioUrl;
    }

    // If metadata is already available for the newly assigned src, apply time immediately
    if (audio.readyState >= 1) {
      onLoaded();
    } else {
      // ensure the browser starts loading metadata
      try { audio.load(); } catch (e) { }
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current)
      audioRef.current.currentTime = parseFloat(e.target.value);
  };

  const fmt = (t: number) => {
    if (!isFinite(t)) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const cardStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Fredoka:wght@500;700&display=swap');

    .player-card {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%);
      border: 2px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      backdrop-filter: blur(10px);
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .player-card.fullscreen {
      width: 90vw;
      height: 90vh;
      max-width: 90vw;
      max-height: 90vh;
      border-radius: 40px;
      border-width: 4px;
    }

    .player-wrap {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      position: relative;
    }

    .player-wrap.fullscreen {
      width: 100vw;
      height: 100vh;
    }

    .player-lyrics {
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
    .player-lyrics::-webkit-scrollbar { display: none; }

    .player-card.fullscreen .player-lyrics {
      padding: 60px 50px;
    }

    .player-lyric-line {
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

    .player-lyric-line.active {
      color: #fff;
      font-size: 22px;
      font-weight: 700;
      transform: translateX(2px);
      background: linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 100%);
      padding: 6px 12px;
      border-radius: 6px;
    }

    .player-lyric-line.near {
      color: rgba(240, 240, 240, 0.35);
      font-size: 16px;
    }

    .player-lyric-line:hover {
      color: rgba(240, 240, 240, 0.6);
      transform: translateX(1px);
    }

    .player-card.fullscreen .player-lyric-line {
      font-size: 48px;
      margin-bottom: 24px;
      padding: 12px 0;
    }

    .player-card.fullscreen .player-lyric-line.active {
      font-size: 64px;
      padding: 16px 32px;
      border-radius: 12px;
    }

    .player-card.fullscreen .player-lyric-line.near {
      font-size: 40px;
    }

    .player-loading {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(240, 240, 240, 0.6);
      font-size: 13px;
      letter-spacing: 0.08em;
      font-weight: 500;
    }

    .player-card.fullscreen .player-loading {
      font-size: 36px;
    }

    .player-controls {
      padding: 12px 14px 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .player-card.fullscreen .player-controls {
      padding: 32px 40px 40px;
      gap: 24px;
    }

    .player-progress-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .player-card.fullscreen .player-progress-row {
      gap: 20px;
    }

    .player-time {
      font-size: 9px;
      color: rgba(240, 240, 240, 0.6);
      letter-spacing: 0.05em;
      min-width: 26px;
      font-weight: 500;
    }
    .player-time:last-child { text-align: right; }

    .player-card.fullscreen .player-time {
      font-size: 24px;
      min-width: 80px;
    }

    .player-track {
      flex: 1;
      height: 3px;
      background: rgba(240, 240, 240, 0.15);
      border-radius: 2px;
      position: relative;
      cursor: pointer;
      overflow: hidden;
    }

    .player-card.fullscreen .player-track {
      height: 8px;
      border-radius: 4px;
    }

    .player-track-fill {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      background: linear-gradient(90deg, #ff006e 0%, #ff006e 50%, rgba(255, 0, 110, 0.7) 100%);
      border-radius: 2px;
      pointer-events: none;
      transition: width 0.1s linear;
    }

    .player-card.fullscreen .player-track-fill {
      border-radius: 4px;
    }

    .player-track input[type=range] {
      position: absolute;
      inset: -6px 0;
      width: 100%;
      opacity: 0;
      cursor: pointer;
      height: 15px;
    }

    .player-btn-row {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 56px;
    }

    .player-card.fullscreen .player-btn-row {
      gap: 30px;
    }

    .player-center-controls {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: center;
    }

    .player-karaoke-btn {
      position: absolute;
      left: 12px;
    }

    .player-karaoke-btn.active {
      border-color: #ff006e !important;
      background: linear-gradient(135deg, rgba(255, 0, 110, 0.5) 0%, rgba(255, 100, 150, 0.4) 100%) !important;
      color: #fff !important;
      box-shadow: 0 0 10px rgba(255, 0, 110, 0.45);
    }

    .player-card.fullscreen .player-karaoke-btn {
      left: 40px;
    }

    .player-fullscreen-btn {
      position: absolute;
      right: 12px;
    }

    .player-card.fullscreen .player-fullscreen-btn {
      right: 40px;
    }

    .player-control-btn {
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

    .player-control-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .player-control-btn:disabled:hover {
      border-color: rgba(255, 255, 255, 0.3);
      background: linear-gradient(135deg, rgba(255, 0, 110, 0.2) 0%, rgba(255, 100, 150, 0.1) 100%);
      color: rgba(240, 240, 240, 0.9);
      transform: none;
    }

    .player-control-btn:hover {
      border-color: rgba(255, 255, 255, 0.5);
      background: linear-gradient(135deg, rgba(255, 0, 110, 0.35) 0%, rgba(255, 100, 150, 0.25) 100%);
      color: #fff;
      transform: scale(1.05);
    }

    .player-control-btn:active { transform: scale(0.95); }

    .player-card.fullscreen .player-control-btn {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      font-size: 28px;
      border-width: 2px;
    }

    .player-card.fullscreen .player-control-btn:hover { transform: scale(1.08); }
    .player-card.fullscreen .player-control-btn:active { transform: scale(0.92); }

    .player-play-btn {
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

    .player-play-btn:hover {
      border-color: #fff;
      background: linear-gradient(135deg, rgba(255, 0, 110, 0.5) 0%, rgba(255, 100, 150, 0.4) 100%);
      color: #fff;
      transform: scale(1.08);
    }

    .player-play-btn:active { transform: scale(0.96); }

    .player-card.fullscreen .player-play-btn {
      width: 100px;
      height: 100px;
      font-size: 42px;
      border-width: 3px;
    }

    .player-card.fullscreen .player-play-btn:hover { transform: scale(1.1); }
    .player-card.fullscreen .player-play-btn:active { transform: scale(0.92); }
  `;

  const cardContent = (
    <div
      ref={wrapRef}
      className={`player-card ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {isLoading ? (
        <div className="player-loading">loading</div>
      ) : (
        <div className="player-lyrics" ref={lyricsRef}>
          {lyrics.map((line, i) => (
            <div
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className={`player-lyric-line ${i === activeIndex
                  ? "active"
                  : Math.abs(i - activeIndex) <= 2
                    ? "near"
                    : ""
                }`}
              onClick={() => {
                if (audioRef.current)
                  audioRef.current.currentTime = line.timeMs / 1000;
              }}
            >
              {line.line}
            </div>
          ))}
        </div>
      )}

      <div className="player-controls">
        <div className="player-progress-row">
          <span className="player-time">{fmt(currentTime)}</span>
          <div className="player-track">
            <div className="player-track-fill" style={{ width: `${progress}%` }} />
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={seek}
              step={0.1}
            />
          </div>
          <span className="player-time">{fmt(duration)}</span>
        </div>
        <div className="player-btn-row">
          <button
            className={`player-control-btn player-karaoke-btn${isKaraokeMode ? ' active' : ''}`}
            onClick={toggleKaraoke}
            title={isKaraokeMode ? "Switch to original" : "Switch to instrumental"}
            disabled={!song}
          >
            🎤
          </button>

          <div className="player-center-controls">
            <button className="player-control-btn" onClick={onPreviousSong} title="Previous song" disabled={!onPreviousSong}>⏮</button>
            <button className="player-play-btn" onClick={togglePlay}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="player-control-btn" onClick={onNextSong} title="Next song" disabled={!onNextSong}>⏭</button>
          </div>

          <button className="player-control-btn player-fullscreen-btn" onClick={toggleFullscreen} title="Fullscreen">⛶</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{cardStyles}</style>
      <audio ref={audioRef} crossOrigin="anonymous" autoPlay />

      {compact ? (
        cardContent
      ) : (
        <div className={`player-wrap ${isFullscreen ? 'fullscreen' : ''}`}>
          {cardContent}
        </div>
      )}
    </>
  );
}
