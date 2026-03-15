"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpeechBubbleProps {
  /** The message to display inside the bubble. */
  text: string;
  /** Controls whether the bubble is visible. Parent should set to false to dismiss. */
  visible: boolean;
  /** Pixel position {x, y} — the tip of the bubble pointer will aim toward here. */
  position: { x: number; y: number };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SpeechBubble
 *
 * A positioned speech bubble that appears near the companion cursor.
 * - Fades in/out smoothly
 * - The triangular pointer always points down-left, toward the companion
 * - Rendered in a fixed portal layer so it escapes any overflow clipping
 *
 * Note: The parent is responsible for hiding this after ~3 s.
 */
export default function SpeechBubble({ text, visible, position }: SpeechBubbleProps) {
  // We track an internal "mounted" flag separately from `visible` so the
  // fade-out animation can complete before we remove from DOM.
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Slight tick so the transition registers after mount
      const t = requestAnimationFrame(() => setOpacity(1));
      return () => cancelAnimationFrame(t);
    } else {
      setOpacity(0);
      // Unmount after the CSS transition finishes (250ms)
      hideTimerRef.current = setTimeout(() => setMounted(false), 280);
      return () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      };
    }
  }, [visible]);

  if (!mounted) return null;

  // Bubble dimensions (approximate)
  const BUBBLE_WIDTH = 220;
  const BUBBLE_HEIGHT = 72; // rough; actual depends on text
  const POINTER_SIZE = 10;
  // Offset the bubble so it appears above-left of the companion (which is to
  // the bottom-right of the cursor). We shift left by bubbleWidth and up by
  // bubbleHeight + pointer so the pointer tip is near the companion.
  const bubbleX = position.x - BUBBLE_WIDTH - 12;
  const bubbleY = position.y - BUBBLE_HEIGHT - POINTER_SIZE - 8;

  // Clamp so bubble stays inside the viewport
  const clampedX = Math.max(8, Math.min(bubbleX, window.innerWidth - BUBBLE_WIDTH - 8));
  const clampedY = Math.max(8, bubbleY);

  return (
    <>
      <style>{`
        @keyframes bubble-fade-in {
          from { opacity: 0; transform: scale(0.9) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          left: clampedX,
          top: clampedY,
          zIndex: 9998,
          pointerEvents: "none",
          opacity,
          transition: "opacity 0.25s ease, transform 0.25s ease",
          transform: opacity === 1 ? "scale(1) translateY(0)" : "scale(0.93) translateY(4px)",
          willChange: "opacity, transform",
          maxWidth: BUBBLE_WIDTH,
        }}
      >
        {/* Bubble body */}
        <div
          style={{
            background: "#252536",
            border: "1px solid rgba(45,45,68,0.9)",
            borderRadius: 12,
            padding: "10px 14px",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
            position: "relative",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#e8e8ed",
              fontSize: 13,
              lineHeight: 1.5,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            {text}
          </p>

          {/* Triangular pointer — pointing down-right toward companion */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -(POINTER_SIZE + 1),
              right: 18,
              width: 0,
              height: 0,
              borderLeft: `${POINTER_SIZE}px solid transparent`,
              borderRight: "0px solid transparent",
              borderTop: `${POINTER_SIZE + 1}px solid rgba(45,45,68,0.9)`,
            }}
          />
          {/* Inner pointer (fills border color) */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -POINTER_SIZE,
              right: 18,
              width: 0,
              height: 0,
              borderLeft: `${POINTER_SIZE}px solid transparent`,
              borderRight: "0px solid transparent",
              borderTop: `${POINTER_SIZE}px solid #252536`,
            }}
          />
        </div>
      </div>
    </>
  );
}
