"use client";

import { useEffect, useState } from "react";
import { isRTL } from "@/lib/languages";
import type { TranscriptSegment } from "@/lib/types";

interface SubtitleOverlayProps {
  currentTime: number;
  subtitles: TranscriptSegment[];
  visible: boolean;
  targetLocale: string;
  originalSubtitles?: TranscriptSegment[];
  sourceLocale?: string;
  dualMode?: boolean;
  fontSize?: "S" | "M" | "L";
}

const FONT_SIZE_CLASS: Record<string, string> = {
  S: "text-sm",
  M: "text-base",
  L: "text-xl",
};

export default function SubtitleOverlay({
  currentTime,
  subtitles,
  visible,
  targetLocale,
  originalSubtitles,
  sourceLocale,
  dualMode = false,
  fontSize = "M",
}: SubtitleOverlayProps) {
  const [displayedText, setDisplayedText] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  const targetRtl = isRTL(targetLocale);
  const sourceRtl = sourceLocale ? isRTL(sourceLocale) : false;

  useEffect(() => {
    if (!visible) {
      setDisplayedText(null);
      setOriginalText(null);
      return;
    }

    // Add a small look-ahead offset to compensate for perceived delay
    // Increased to 0.8s based on user feedback of delay
    const offset = 0.8;
    const activeTime = currentTime + offset;

    const active = subtitles.find(
      (seg) => activeTime >= seg.start && activeTime <= seg.end
    );
    const nextText = active?.text ?? null;

    // Find matching original subtitle
    let nextOriginal: string | null = null;
    if (dualMode && originalSubtitles) {
      const orig = originalSubtitles.find(
        (seg) => activeTime >= seg.start && activeTime <= seg.end
      );
      nextOriginal = orig?.text ?? null;
    }

    setDisplayedText((prev) => {
      if (prev !== nextText) {
        setFadeKey((k) => k + 1);
      }
      return nextText;
    });
    setOriginalText(nextOriginal);
  }, [currentTime, subtitles, originalSubtitles, visible, dualMode]);

  if (!visible || !displayedText) return null;

  return (
    <div
      className="absolute bottom-16 left-0 right-0 flex justify-center px-6 pointer-events-none z-10"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        key={fadeKey}
        className="
          animate-subtitle-fade
          max-w-3xl px-5 py-2.5 rounded-lg
          bg-black/85 backdrop-blur-md
          font-medium leading-relaxed
          shadow-2xl text-center select-none
          border border-white/10
        "
        style={{
          textShadow: "0 1px 2px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)",
        }}
      >
        {/* Original text (dual mode) */}
        {dualMode && originalText && (
          <>
            <div
              dir={sourceRtl ? "rtl" : "ltr"}
              className="text-xs text-white/60"
            >
              {originalText.replace(/<[^>]+>/g, "")}
            </div>
            <div className="w-12 h-px bg-white/10 mx-auto my-1" />
          </>
        )}

        {/* Translated text */}
        <div
          dir={targetRtl ? "rtl" : "ltr"}
          className={`text-white ${FONT_SIZE_CLASS[fontSize]}`}
        >
          {displayedText.replace(/<[^>]+>/g, "")}
        </div>
      </div>

      {/* Inline keyframe for subtitle fade */}
      <style>{`
        @keyframes subtitleFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-subtitle-fade {
          animation: subtitleFadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
