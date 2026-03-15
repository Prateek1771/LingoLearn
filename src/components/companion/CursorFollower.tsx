"use client";

import { useEffect, useRef, useState } from "react";
import { getCompanion } from "@/lib/companions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompanionState = "idle" | "celebration" | "encouragement";

interface CursorFollowerProps {
  companionId: string;
  state: CompanionState;
}

// ─── Lerp helper ─────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CursorFollower
 *
 * Renders the chosen character GIF that smoothly follows the
 * mouse cursor using requestAnimationFrame-driven lerp interpolation.
 * Positioned offset to the bottom-right of the cursor (24px gap).
 *
 * State animations:
 * - idle          → no extra animation
 * - celebration   → scale bounce via CSS keyframes
 * - encouragement → gentle wobble via CSS keyframes
 */
export default function CursorFollower({ companionId, state }: CursorFollowerProps) {
  // Current rendered position (interpolated)
  const posRef = useRef({ x: -200, y: -200 });
  // Target position (raw mouse)
  const targetRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number | null>(null);
  const divRef = useRef<HTMLDivElement>(null);

  // Track whether the mouse has entered the window
  const [visible, setVisible] = useState(false);
  // Drive re-renders via position state updates
  const [displayPos, setDisplayPos] = useState({ x: -200, y: -200 });

  // Load companion details
  const companion = getCompanion(companionId);
  const gifUrl = state === "celebration" 
    ? companion?.celebrationGif 
    : state === "encouragement" 
      ? companion?.encouragementGif 
      : companion?.idleGif;

  // ── RAF animation loop ────────────────────────────────────────────────────

  useEffect(() => {
    function tick() {
      const cur = posRef.current;
      const tgt = targetRef.current;

      const nx = lerp(cur.x, tgt.x, 0.12);
      const ny = lerp(cur.y, tgt.y, 0.12);

      posRef.current = { x: nx, y: ny };
      setDisplayPos({ x: nx, y: ny });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Mouse tracking ────────────────────────────────────────────────────────

  useEffect(() => {
    const SIZE = 64;
    // Track previous X and smoothed direction (local to effect closure)
    const prevXRef = { current: -1 };
    const dirRef = { current: 0 }; // smoothed direction: -1 = left, +1 = right

    function handleMouseMove(e: MouseEvent) {
      setVisible(true);

      // Initialize prevX on first call
      if (prevXRef.current === -1) prevXRef.current = e.clientX;
      const dx = e.clientX - prevXRef.current;
      prevXRef.current = e.clientX;

      // Lerp direction toward ±1 based on horizontal movement
      if (Math.abs(dx) > 0.5) {
        dirRef.current = lerp(dirRef.current, dx > 0 ? 1 : -1, 0.12);
      }

      // X: trail behind cursor — character sits on the side the cursor came from
      // dir=+1 (moving right) → character to the left (targetX = cursorX - SIZE)
      // dir=-1 (moving left)  → character to the right (targetX = cursorX)
      const rawX = e.clientX - SIZE * (dirRef.current + 1) / 2;
      const x = Math.min(Math.max(rawX, 0), window.innerWidth - SIZE - 4);

      // Y: keep centered on cursor
      const rawY = e.clientY - SIZE / 2;
      const y = Math.min(Math.max(rawY, 0), window.innerHeight - SIZE - 4);

      targetRef.current = { x, y };
    }

    function handleMouseLeave() {
      setVisible(false);
    }

    function handleMouseEnter() {
      setVisible(true);
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  // ── Derive animation class from state ─────────────────────────────────────

  let animationClass = "";
  if (state === "celebration") {
    animationClass = "companion-celebrate";
  } else if (state === "encouragement") {
    animationClass = "companion-wobble";
  }

  return (
    <>
      {/* Scoped keyframe definitions */}
      <style>{`
        @keyframes companion-bounce {
          0%, 100% { transform: scale(1); }
          15%       { transform: scale(1.35) rotate(-6deg); }
          30%       { transform: scale(0.88) rotate(4deg); }
          45%       { transform: scale(1.2)  rotate(-3deg); }
          60%       { transform: scale(0.94) rotate(2deg); }
          75%       { transform: scale(1.08) rotate(-1deg); }
        }
        @keyframes companion-wobble {
          0%, 100% { transform: rotate(0deg); }
          20%       { transform: rotate(-8deg); }
          40%       { transform: rotate(7deg); }
          60%       { transform: rotate(-5deg); }
          80%       { transform: rotate(4deg); }
        }
        .companion-celebrate {
          animation: companion-bounce 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .companion-wobble {
          animation: companion-wobble 1s ease-in-out infinite;
        }
      `}</style>

      <div
        ref={divRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: displayPos.x,
          top: displayPos.y,
          width: 64,
          height: 64,
          zIndex: 9999,
          pointerEvents: "none",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.25s ease",
          willChange: "transform",
        }}
      >
        <div
          className={animationClass}
          style={{
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
        >
          {gifUrl ? (
            <img 
              src={gifUrl} 
              alt={companion?.name || "Companion"} 
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
              }}
            />
          ) : (
             <span style={{ fontSize: 32 }}>✨</span>
          )}
        </div>
      </div>
    </>
  );
}
