"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "@/contexts/UILanguageContext";
import type { Breakpoint, TranscriptSegment } from "@/lib/types";
import { getSubtitlePrefs, saveSubtitlePrefs, type SubtitlePrefs } from "@/lib/subtitle-prefs";
import ProgressBar from "./ProgressBar";
import SubtitleOverlay from "./SubtitleOverlay";
import SubtitleSettings from "./SubtitleSettings";

// ─── Dynamic import (SSR: false) ─────────────────────────────────────────────
const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <Spinner />
    </div>
  ),
});

// ─── Small helper components ──────────────────────────────────────────────────

function Spinner() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-muted text-sm">{t("video.loading")}</span>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function SubtitleOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z" />
    </svg>
  );
}

function SubtitleOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M4 4H3L2 5v14l1 1h18l1-1V5l-1-1H4zm0 14V6h16v12H4zM6 10h2v2H6zm4 0h8v2h-8zm-4 4h5v2H6zm7 0h5v2h-5z" opacity=".3" />
      <path d="M3 3L2 4v1l19 15 1-1v-1L3 3z" />
    </svg>
  );
}

function VolumeHighIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function VolumeMuteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
}

interface VideoPlayerProps {
  videoUrl: string;
  breakpoints: Breakpoint[];
  translatedSubtitles: TranscriptSegment[];
  targetLocale: string;
  onBreakpointReached: (breakpointIndex: number) => void;
  breakpointsCleared: boolean[];
  onProgressUpdate: (seconds: number) => void;
  originalSubtitles?: TranscriptSegment[];
  sourceLocale?: string;
  onEnd?: () => void;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;
type SpeedOption = (typeof SPEED_OPTIONS)[number];

// ─── Component ────────────────────────────────────────────────────────────────

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer({
  videoUrl,
  breakpoints,
  translatedSubtitles,
  targetLocale,
  onBreakpointReached,
  breakpointsCleared,
  onProgressUpdate,
  originalSubtitles,
  sourceLocale,
  onEnd,
}, ref) {
  const { t } = useTranslation();
  const playerRef = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<SpeedOption>(1);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [ready, setReady] = useState(false);
  const [subtitlePrefs, setSubtitlePrefs] = useState<SubtitlePrefs>(getSubtitlePrefs);
  
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePrefsChange = useCallback((prefs: SubtitlePrefs) => {
    setSubtitlePrefs(prefs);
    saveSubtitlePrefs(prefs);
  }, []);

  const firedBreakpoints = useRef<Set<number>>(new Set());

  // Safety net: force isReady if player hangs for too long
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (!ready) {
        console.warn("Player loading timed out, forcing ready state");
        setReady(true);
      }
    }, 5000);

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [ready]);

  useEffect(() => {
    breakpointsCleared.forEach((cleared, i) => {
      if (cleared) firedBreakpoints.current.add(i);
    });
  }, [breakpointsCleared]);

  const onPlayerReady = useCallback(() => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    setReady(true);
  }, []);

  // Use native event listeners for custom element compatibility (react-player v3 + youtube-video-element)
  const breakpointsRef = useRef(breakpoints);
  const breakpointsClearedRef = useRef(breakpointsCleared);
  const onBreakpointReachedRef = useRef(onBreakpointReached);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  breakpointsRef.current = breakpoints;
  breakpointsClearedRef.current = breakpointsCleared;
  onBreakpointReachedRef.current = onBreakpointReached;
  onProgressUpdateRef.current = onProgressUpdate;

  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;

    const handleTimeUpdate = () => {
      const t = typeof el.currentTime === "number" && isFinite(el.currentTime) ? el.currentTime : 0;
      setCurrentTime(t);
      onProgressUpdateRef.current(t);

      const bps = breakpointsRef.current;
      const cleared = breakpointsClearedRef.current;
      for (let i = 0; i < bps.length; i++) {
        if (firedBreakpoints.current.has(i)) {
          if (!cleared[i] && t < bps[i].timestamp - 1) {
            firedBreakpoints.current.delete(i);
          }
          continue;
        }
        if (t >= bps[i].timestamp) {
          firedBreakpoints.current.add(i);
          setPlaying(false);
          onBreakpointReachedRef.current(i);
          break;
        }
      }
    };

    const handleDur = () => {
      const d = el.duration;
      setDuration(typeof d === "number" && isFinite(d) ? d : 0);
    };

    el.addEventListener("timeupdate", handleTimeUpdate);
    el.addEventListener("durationchange", handleDur);
    // Also check duration immediately in case it's already loaded
    if (el.duration && isFinite(el.duration)) setDuration(el.duration);

    return () => {
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("durationchange", handleDur);
    };
  }, [ready]); // Re-attach when player becomes ready

  const handleSeek = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = seconds;
    }
    setCurrentTime(seconds);
  }, []);

  useImperativeHandle(ref, () => ({
    seekTo: (s: number) => {
      handleSeek(s);
      setPlaying(true);
    },
  }), [handleSeek]);

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          setPlaying((p) => !p);
          break;
        case "m":
          setMuted((m) => !m);
          break;
        case "d":
          handlePrefsChange({ ...subtitlePrefs, dualMode: !subtitlePrefs.dualMode });
          break;
        case "+":
        case "=": {
          const sizes: SubtitlePrefs["fontSize"][] = ["S", "M", "L"];
          const idx = sizes.indexOf(subtitlePrefs.fontSize);
          if (idx < sizes.length - 1) {
            handlePrefsChange({ ...subtitlePrefs, fontSize: sizes[idx + 1] });
          }
          break;
        }
        case "-": {
          const sizes: SubtitlePrefs["fontSize"][] = ["S", "M", "L"];
          const idx = sizes.indexOf(subtitlePrefs.fontSize);
          if (idx > 0) {
            handlePrefsChange({ ...subtitlePrefs, fontSize: sizes[idx - 1] });
          }
          break;
        }
        case "ArrowRight":
          e.preventDefault();
          handleSeek(Math.min(currentTime + 5, duration));
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(Math.max(currentTime - 5, 0));
          break;
      }
    },
    [currentTime, duration, handleSeek, subtitlePrefs, handlePrefsChange]
  );

  const effectiveVolume = muted ? 0 : volume;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden glass-panel border border-border/40 shadow-2xl shadow-black/60 outline-none"
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      aria-label="Video player"
    >
      <div className="relative w-full aspect-video hidden-youtube-cc">
        <ReactPlayer
          ref={playerRef}
          src={videoUrl}
          playing={playing}
          volume={effectiveVolume}
          playbackRate={playbackRate}
          onReady={onPlayerReady}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); onEnd?.(); }}
          /* timeupdate and durationchange handled via native listeners in useEffect */
          config={{
            youtube: {
              cc_load_policy: 0,
              cc_lang_pref: "zz",
              iv_load_policy: 3,
              rel: 0,
              disablekb: 1,
            }
          }}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        <div className="absolute inset-0 cursor-pointer z-[1]" onClick={() => setPlaying((p) => !p)} aria-hidden="true" />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <Spinner />
          </div>
        )}

        <PlayPulse playing={playing} />

        <SubtitleOverlay
          currentTime={currentTime}
          subtitles={translatedSubtitles}
          visible={showSubtitles}
          targetLocale={targetLocale}
          originalSubtitles={originalSubtitles}
          sourceLocale={sourceLocale}
          dualMode={subtitlePrefs.dualMode}
          fontSize={subtitlePrefs.fontSize}
        />
      </div>

      <div className="flex flex-col gap-3 px-4 pt-3 pb-4 border-t border-border/40 bg-surface/80 backdrop-blur-md">
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          breakpoints={breakpoints}
          breakpointsCleared={breakpointsCleared}
          onSeek={handleSeek}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={!ready}
            aria-label={playing ? t("video.pause") : t("video.play")}
            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-primary hover:bg-primary-light text-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>

          <div
            className="relative flex items-center gap-1.5"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? t("video.unmute") : t("video.mute")}
              className="p-1.5 rounded-md text-muted hover:text-foreground transition-colors duration-150"
            >
              {muted ? <VolumeMuteIcon /> : <VolumeHighIcon />}
            </button>

            {/* Desktop: hover-expand slider */}
            <div className={`hidden sm:block overflow-hidden transition-all duration-200 ease-out ${showVolumeSlider ? "w-20 opacity-100" : "w-0 opacity-0"}`}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={effectiveVolume}
                aria-label={t("video.volume")}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (val > 0) setMuted(false);
                }}
                className="w-full h-1 accent-primary cursor-pointer block"
              />
            </div>
            {/* Mobile: always visible compact slider */}
            <div className="block sm:hidden w-16">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={effectiveVolume}
                aria-label={t("video.volume")}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (val > 0) setMuted(false);
                }}
                className="w-full h-1 accent-primary cursor-pointer block"
              />
            </div>
          </div>

          <div className="flex-1" />

          {translatedSubtitles.length > 0 && (
            <button
              onClick={() => setShowSubtitles((s) => !s)}
              aria-label={showSubtitles ? t("video.hideSubtitles") : t("video.showSubtitles")}
              aria-pressed={showSubtitles}
              className={`p-1.5 rounded-md transition-colors duration-150 ${showSubtitles ? "text-accent hover:text-accent-light" : "text-muted hover:text-foreground"}`}
            >
              {showSubtitles ? <SubtitleOnIcon /> : <SubtitleOffIcon />}
            </button>
          )}

          {translatedSubtitles.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu((s) => !s)}
                aria-label={t("video.subtitleSettings")}
                className="p-1.5 rounded-md text-muted hover:text-foreground transition-colors duration-150"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
                </svg>
              </button>
              {showSettingsMenu && (
                <SubtitleSettings
                  prefs={subtitlePrefs}
                  onPrefsChange={handlePrefsChange}
                  onClose={() => setShowSettingsMenu(false)}
                />
              )}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu((s) => !s)}
              aria-label={t("video.playbackSpeed")}
              className="px-2.5 py-1 rounded-md text-xs font-semibold text-muted hover:text-foreground bg-surface-light hover:bg-border transition-colors duration-150 min-w-[2.75rem] text-center"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowSpeedMenu(false)} aria-hidden="true" />
                <div role="listbox" className="absolute bottom-full right-0 mb-2 z-30 min-w-[5.5rem] bg-surface-light border border-border rounded-lg shadow-xl overflow-hidden animate-fade-in">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      role="option"
                      aria-selected={playbackRate === speed}
                      onClick={() => { setPlaybackRate(speed); setShowSpeedMenu(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-100 ${playbackRate === speed ? "bg-primary/20 text-primary-light font-semibold" : "text-foreground hover:bg-border"}`}
                    >
                      <span>{speed}x</span>
                      {playbackRate === speed && (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-primary-light">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default VideoPlayer;

function PlayPulse({ playing }: { playing: boolean }) {
  const [visible, setVisible] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (playing !== wasPlaying) {
      setWasPlaying(playing);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 600);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, wasPlaying]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[2]">
      <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white animate-[ping_0.5s_ease-out_forwards]" style={{ animation: "playPulse 0.5s ease-out forwards" }}>
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
      </div>
      <style>{`
        @keyframes playPulse {
          0%   { opacity: 0; transform: scale(0.6); }
          30%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
