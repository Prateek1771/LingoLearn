"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import VideoPlayer, { type VideoPlayerHandle } from "@/components/video-player/VideoPlayer";
import QuizPopup from "@/components/quiz/QuizPopup";
import CursorFollower from "@/components/companion/CursorFollower";
import SpeechBubble from "@/components/companion/SpeechBubble";

import { getSession, updateProgress, updateSession, saveFinalQuiz, markFinalQuizPassed } from "@/lib/session";
import { getCompanion } from "@/lib/companions";
import { LANGUAGE_REGIONS, isRTL } from "@/lib/languages";
import type { Session, TranslatedContent, Breakpoint } from "@/lib/types";
import { useTranslation } from "@/contexts/UILanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type CompanionState = "idle" | "celebration" | "encouragement";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12V5h7v7a3.5 3.5 0 0 1-3.5 3.5Z" opacity=".4" />
      <path d="M8.5 5H4a1 1 0 0 0-1 1v2a4 4 0 0 0 4 4h1.15A5.5 5.5 0 0 0 12 15.5V18h-2a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-2v-2.5A5.5 5.5 0 0 0 16.85 12H18a4 4 0 0 0 4-4V6a1 1 0 0 0-1-1h-4.5M8.5 5h7M8.5 5V3m7 2V3" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LearnSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : "";
  const { t } = useTranslation();

  // ── Session state ─────────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);

  // ── Video player ref ─────────────────────────────────────────────────────
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);

  // ── Quiz state ────────────────────────────────────────────────────────────
  const [activeBreakpointIndex, setActiveBreakpointIndex] = useState<number | null>(null);
  const [quizVisible, setQuizVisible] = useState(false);
  const [isRetry, setIsRetry] = useState(false);

  // ── Final quiz state ──────────────────────────────────────────────────────
  const [finalQuizVisible, setFinalQuizVisible] = useState(false);
  const [isGeneratingFinalQuiz, setIsGeneratingFinalQuiz] = useState(false);
  const [finalQuizIsRetry, setFinalQuizIsRetry] = useState(false);
  const [finalQuizGenError, setFinalQuizGenError] = useState(false);

  // ── Lazy prefetch state ───────────────────────────────────────────────────
  const prefetchInProgress = useRef(false);

  // ── Background final quiz generation ────────────────────────────────────
  const finalQuizGenerationRef = useRef<{
    inProgress: boolean;
    abortController: AbortController | null;
    targetLocale: string | null;
  }>({ inProgress: false, abortController: null, targetLocale: null });

  // ── Language switching state ────────────────────────────────────────────
  const [isTranslating, setIsTranslating] = useState(false);

  // ── Companion state ───────────────────────────────────────────────────────
  const [companionState, setCompanionState] = useState<CompanionState>("idle");
  const [speechText, setSpeechText] = useState("");
  const [speechVisible, setSpeechVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const cursorHasMoved = useRef(false);
  const speechDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load session on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) {
      setNotFound(true);
      return;
    }
    const s = getSession(sessionId);
    if (!s) {
      setNotFound(true);
      return;
    }
    setSession(s);
  }, [sessionId]);

  // ── Track cursor position for speech bubble placement ────────────────────
  useEffect(() => {
    function track(e: MouseEvent) {
      cursorHasMoved.current = true;
      setCursorPos({ x: e.clientX + 20, y: e.clientY + 20 });
    }
    window.addEventListener("mousemove", track, { passive: true });
    return () => window.removeEventListener("mousemove", track);
  }, []);

  // ── Companion speech helper ───────────────────────────────────────────────
  const showSpeech = useCallback(
    (text: string, duration = 3000) => {
      if (!text) return;
      setSpeechText(text);
      setSpeechVisible(true);
      if (speechDismissTimer.current) clearTimeout(speechDismissTimer.current);
      speechDismissTimer.current = setTimeout(() => setSpeechVisible(false), duration);
    },
    []
  );

  const triggerCompanionState = useCallback(
    (nextState: CompanionState, text: string, resetAfterMs = 2200) => {
      setCompanionState(nextState);
      showSpeech(text);
      setTimeout(() => setCompanionState("idle"), resetAfterMs);
    },
    [showSpeech]
  );

  // Cleanup timer and abort controller on unmount
  useEffect(
    () => () => {
      if (speechDismissTimer.current) clearTimeout(speechDismissTimer.current);
      finalQuizGenerationRef.current.abortController?.abort();
    },
    []
  );

  // ── Lazy prefetch next quiz window ───────────────────────────────────────

  const prefetchNextWindow = useCallback(async () => {
    if (prefetchInProgress.current || !session?.rawTranscript) return;
    const generatedUpTo = session.quizzesGeneratedUpTo ?? 0;
    if (generatedUpTo >= session.metadata.duration) return;

    prefetchInProgress.current = true;
    try {
      const nextEnd = Math.min(generatedUpTo + 20 * 60, session.metadata.duration);
      const windowDuration = nextEnd - generatedUpTo;
      const totalDuration = session.metadata.duration;
      const maxBp = Math.max(
        1,
        Math.ceil(session.quizFrequency.maxBreakpoints * (windowDuration / totalDuration))
      );

      // 1. Generate quizzes for next window
      const quizzesRes = await fetch("/api/generate-quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: session.rawTranscript,
          maxBreakpoints: maxBp,
          questionsPerBreakpoint: session.quizFrequency.questionsPerBreakpoint,
          startTime: generatedUpTo,
          endTime: nextEnd,
        }),
      });
      if (!quizzesRes.ok) return;
      const { breakpoints: newBps } = (await quizzesRes.json()) as { breakpoints: Breakpoint[] };
      if (newBps.length === 0) {
        const updated = updateSession(session.id, { quizzesGeneratedUpTo: nextEnd });
        if (updated) setSession(updated);
        return;
      }

      // 2. Translate new breakpoints
      const translateRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: session.rawTranscript,
          breakpoints: newBps,
          sourceLocale: session.sourceLocale,
          targetLocale: session.targetLocale,
        }),
      });
      if (!translateRes.ok) return;
      const data = await translateRes.json() as { translatedContent: TranslatedContent, fallback?: boolean };
      if (data.fallback) return;
      const newTranslated = data.translatedContent;

      // 3. Merge sorted breakpoints
      const mergedBps = [...session.translatedContent.breakpoints, ...newTranslated.breakpoints].sort(
        (a, b) => a.timestamp - b.timestamp
      );
      const mergedTranslatedContent = {
        ...session.translatedContent,
        breakpoints: mergedBps,
      };

      // 4. Extend progress arrays
      const extraCount = newTranslated.breakpoints.length;
      const mergedProgress = {
        ...session.progress,
        breakpointsCleared: [...session.progress.breakpointsCleared, ...new Array(extraCount).fill(false)],
        attemptsPerBreakpoint: [...session.progress.attemptsPerBreakpoint, ...new Array(extraCount).fill(0)],
      };

      // 5. Persist and update state
      const updated = updateSession(session.id, {
        translatedContent: mergedTranslatedContent,
        progress: mergedProgress,
        quizzesGeneratedUpTo: nextEnd,
      });
      if (updated) setSession(updated);
    } catch (err) {
      console.error("Prefetch next window failed:", err);
    } finally {
      prefetchInProgress.current = false;
    }
  }, [session]);

  // ── Progress helpers ──────────────────────────────────────────────────────

  const saveProgress = useCallback(
    (updates: Partial<Session["progress"]>) => {
      if (!session) return;
      const updated = updateProgress(session.id, updates);
      if (updated) setSession(updated);
    },
    [session]
  );

  // ── VideoPlayer callbacks ─────────────────────────────────────────────────

  const handleProgressUpdate = useCallback(
    (seconds: number) => {
      saveProgress({ lastPlaybackPosition: seconds });

      // Trigger prefetch when 5 min away from the last-generated timestamp
      const generatedUpTo = session?.quizzesGeneratedUpTo ?? 0;
      const timeUntilEnd = generatedUpTo - seconds;
      if (timeUntilEnd > 0 && timeUntilEnd <= 5 * 60) {
        prefetchNextWindow();
      }
    },
    [saveProgress, session, prefetchNextWindow]
  );

  const handleBreakpointReached = useCallback(
    (index: number) => {
      if (!session) return;
      setActiveBreakpointIndex(index);
      setIsRetry(false);
      setQuizVisible(true);

      // Companion reacts: breakpointReached dialogue or generic
      const dialogue = session.translatedContent.companionDialogue;
      const isJolly = session.mode === "jolly";
      if (isJolly) {
        triggerCompanionState(
          "encouragement",
          dialogue.breakpointReached || t("learn.companionTimeForQuiz"),
          2000
        );
      }
    },
    [session, triggerCompanionState]
  );

  // ── Background final quiz generation ─────────────────────────────────────

  const generateFinalQuizInBackground = useCallback(async () => {
    if (!session) return;
    // Guard: already generated or already in progress
    if (session.finalQuiz !== undefined) return;
    if (finalQuizGenerationRef.current.inProgress) return;

    const abortController = new AbortController();
    finalQuizGenerationRef.current = {
      inProgress: true,
      abortController,
      targetLocale: session.targetLocale,
    };

    try {
      const duration = session.metadata.duration;
      const questionsPerBreakpoint = duration < 300 ? 5 : duration < 900 ? 7 : 10;
      const transcriptToUse = session.rawTranscript ?? session.originalTranscript;

      const res = await fetch("/api/generate-quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptToUse,
          maxBreakpoints: 1,
          questionsPerBreakpoint,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error("Failed to generate final quiz");
      const { breakpoints } = (await res.json()) as { breakpoints: Breakpoint[] };
      let finalQuiz = breakpoints[0] ?? null;

      // Translate if needed
      if (finalQuiz && session.sourceLocale !== session.targetLocale) {
        try {
          const translateRes = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: [],
              breakpoints: [finalQuiz],
              sourceLocale: session.sourceLocale,
              targetLocale: session.targetLocale,
            }),
            signal: abortController.signal,
          });
          if (translateRes.ok) {
            const { translatedContent } = await translateRes.json();
            if (translatedContent?.breakpoints?.[0]) {
              finalQuiz = translatedContent.breakpoints[0];
            }
          }
        } catch (e) {
          if ((e as Error).name === "AbortError") throw e;
          console.warn("Final quiz translation failed, using English:", e);
        }
      }

      // Check locale hasn't changed before saving
      if (finalQuizGenerationRef.current.targetLocale !== session.targetLocale) return;

      const updated = saveFinalQuiz(session.id, finalQuiz);
      if (updated) setSession(updated);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Background final quiz generation failed:", err);
    } finally {
      finalQuizGenerationRef.current.inProgress = false;
      finalQuizGenerationRef.current.abortController = null;
    }
  }, [session]);

  // ── Quiz callbacks ────────────────────────────────────────────────────────

  const handleQuizPass = useCallback(() => {
    if (!session || activeBreakpointIndex === null) return;

    // Update progress: mark this breakpoint as cleared, advance index
    const newCleared = [...session.progress.breakpointsCleared];
    newCleared[activeBreakpointIndex] = true;
    const newAttempts = [...session.progress.attemptsPerBreakpoint];
    newAttempts[activeBreakpointIndex] = (newAttempts[activeBreakpointIndex] ?? 0) + 1;

    const totalBp = session.translatedContent.breakpoints.length;
    const allCleared = newCleared.every(Boolean);
    const nextIndex = Math.min(activeBreakpointIndex + 1, totalBp);

    saveProgress({
      breakpointsCleared: newCleared,
      attemptsPerBreakpoint: newAttempts,
      currentBreakpointIndex: nextIndex,
    });

    // Close popup
    setQuizVisible(false);
    setActiveBreakpointIndex(null);
    setIsRetry(false);

    // Pre-generate final quiz when all breakpoints cleared
    if (allCleared) {
      generateFinalQuizInBackground();
    }

    // Companion celebration
    const dialogue = session.translatedContent.companionDialogue;
    const isJolly = session.mode === "jolly";

    if (isJolly) {
      if (allCleared) {
        triggerCompanionState(
          "celebration",
          dialogue.videoComplete || t("learn.companionCompleted"),
          3000
        );
      } else {
        // Vary between quizPass and almostThere / keepGoing for mid-way breakpoints
        const cleared = newCleared.filter(Boolean).length;
        const ratio = cleared / totalBp;
        let text = dialogue.quizPass || t("learn.companionGreatJob");
        if (ratio >= 0.75) {
          text = dialogue.almostThere || dialogue.quizPass || t("learn.companionAlmostThere");
        } else if (ratio >= 0.4) {
          text = dialogue.keepGoing || dialogue.quizPass || t("learn.companionKeepGoing");
        }
        triggerCompanionState("celebration", text, 2500);
      }
    }
  }, [session, activeBreakpointIndex, saveProgress, triggerCompanionState, generateFinalQuizInBackground]);

  const handleQuizClose = useCallback(() => {
    if (!session) return;

    if (!isRetry) {
      // First fail: mark attempt, give one retry
      if (activeBreakpointIndex !== null) {
        const newAttempts = [...session.progress.attemptsPerBreakpoint];
        newAttempts[activeBreakpointIndex] = (newAttempts[activeBreakpointIndex] ?? 0) + 1;
        saveProgress({ attemptsPerBreakpoint: newAttempts });

        if (session.mode === "jolly") {
          const dialogue = session.translatedContent.companionDialogue;
          triggerCompanionState(
            "encouragement",
            dialogue.quizFail || dialogue.encouragement || t("learn.companionTryAgain"),
            2500
          );
        }
      }
      setIsRetry(true);
      setQuizVisible(false);
      setTimeout(() => setQuizVisible(true), 80);
    } else {
      // Second fail: close popup and seek video back to breakpoint timestamp
      setQuizVisible(false);
      setIsRetry(false);
      if (activeBreakpointIndex !== null) {
        const bp = session.translatedContent.breakpoints[activeBreakpointIndex];
        if (bp) {
          const prevBpTimestamp = activeBreakpointIndex > 0 
            ? session.translatedContent.breakpoints[activeBreakpointIndex - 1].timestamp 
            : 0;
          const targetSeek = Math.max(prevBpTimestamp, bp.timestamp - 45); // Rewind up to 45 seconds or previous breakpoint
          triggerCompanionState("encouragement", "Let's re-watch this segment and try again!", 4000);
          videoPlayerRef.current?.seekTo(targetSeek);
        }
      }
      setActiveBreakpointIndex(null);
    }
  }, [session, activeBreakpointIndex, isRetry, saveProgress, triggerCompanionState, t]);

  // ── Final quiz handlers ───────────────────────────────────────────────────

  const handleVideoEnd = useCallback(async () => {
    if (!session) return;

    // If already generated, auto-show the quiz popup
    if (session.finalQuiz !== undefined) {
      if (session.finalQuiz !== null) setFinalQuizVisible(true);
      return;
    }
    if (finalQuizGenerationRef.current.inProgress) return;

    // Edge case: video ended before last breakpoint was passed, generate on-demand
    setIsGeneratingFinalQuiz(true);
    setFinalQuizGenError(false);
    try {
      const duration = session.metadata.duration;
      const questionsPerBreakpoint = duration < 300 ? 5 : duration < 900 ? 7 : 10;
      const transcriptToUse = session.rawTranscript ?? session.originalTranscript;

      const res = await fetch("/api/generate-quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptToUse,
          maxBreakpoints: 1,
          questionsPerBreakpoint,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate final quiz");
      const { breakpoints } = (await res.json()) as { breakpoints: Breakpoint[] };
      let finalQuiz = breakpoints[0] ?? null;

      // Translate the final quiz if target language is not English
      if (finalQuiz && session.sourceLocale !== session.targetLocale) {
        try {
          const translateRes = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: [],
              breakpoints: [finalQuiz],
              sourceLocale: session.sourceLocale,
              targetLocale: session.targetLocale,
            }),
          });
          if (translateRes.ok) {
            const { translatedContent } = await translateRes.json();
            if (translatedContent?.breakpoints?.[0]) {
              finalQuiz = translatedContent.breakpoints[0];
            }
          }
        } catch (e) {
          console.warn("Final quiz translation failed, using English:", e);
        }
      }

      const updated = saveFinalQuiz(session.id, finalQuiz);
      if (updated) {
        setSession(updated);
        if (finalQuiz) setFinalQuizVisible(true);
      }
    } catch (err) {
      console.error("Final quiz generation failed:", err);
      setFinalQuizGenError(true);
    } finally {
      setIsGeneratingFinalQuiz(false);
    }
  }, [session]);

  const handleTakeFinalQuiz = useCallback(async () => {
    if (!session) return;

    // Quiz already cached — show instantly
    if (session.finalQuiz !== undefined) {
      if (session.finalQuiz !== null) setFinalQuizVisible(true);
      return;
    }

    // Background generation in progress — poll until ready
    if (finalQuizGenerationRef.current.inProgress) {
      setIsGeneratingFinalQuiz(true);
      setFinalQuizGenError(false);
      const poll = () =>
        new Promise<Session | null>((resolve) => {
          const interval = setInterval(() => {
            const fresh = getSession(session.id);
            if (fresh?.finalQuiz !== undefined || !finalQuizGenerationRef.current.inProgress) {
              clearInterval(interval);
              resolve(fresh);
            }
          }, 500);
        });
      const fresh = await poll();
      setIsGeneratingFinalQuiz(false);
      if (fresh) {
        setSession(fresh);
        if (fresh.finalQuiz) setFinalQuizVisible(true);
      }
      return;
    }

    // Not started — fall through to on-demand generation
    await handleVideoEnd();
    // handleVideoEnd now auto-shows the popup, but if session state
    // wasn't updated in closure, read fresh and show
    const fresh = getSession(session.id);
    if (fresh?.finalQuiz && !finalQuizVisible) {
      setSession(fresh);
      setFinalQuizVisible(true);
    }
  }, [session, handleVideoEnd]);

  const handleFinalQuizPass = useCallback(() => {
    if (!session) return;
    setFinalQuizVisible(false);
    setFinalQuizIsRetry(false);
    const updated = markFinalQuizPassed(session.id);
    if (updated) setSession(updated);
    if (session.mode === "jolly") {
      const dialogue = session.translatedContent.companionDialogue;
      triggerCompanionState("celebration", dialogue.videoComplete || t("learn.companionCertReady"), 3000);
    }
  }, [session, triggerCompanionState]);

  const handleFinalQuizClose = useCallback(() => {
    if (!finalQuizIsRetry) {
      setFinalQuizIsRetry(true);
      setFinalQuizVisible(false);
      setTimeout(() => setFinalQuizVisible(true), 80);
    } else {
      setFinalQuizVisible(false);
      setFinalQuizIsRetry(false);
      triggerCompanionState("encouragement", "Let's review the end of the video and try again!", 4000);
      const lastBpTimestamp = session && session.translatedContent.breakpoints.length > 0
        ? session.translatedContent.breakpoints[session.translatedContent.breakpoints.length - 1].timestamp 
        : ((session?.metadata.duration ?? 60) - 60);
      videoPlayerRef.current?.seekTo(Math.max(0, lastBpTimestamp));
    }
  }, [finalQuizIsRetry, triggerCompanionState, session]);

  // ── Derived values ────────────────────────────────────────────────────────

  const breakpointsCleared = session?.progress.breakpointsCleared ?? [];
  const totalBreakpoints = session?.translatedContent.breakpoints.length ?? 0;
  const clearedCount = breakpointsCleared.filter(Boolean).length;
  const allBreakpointsCleared = totalBreakpoints > 0 && clearedCount === totalBreakpoints;
  const finalQuizPassed = session?.progress.finalQuizPassed === true;
  const allCleared = allBreakpointsCleared && finalQuizPassed;

  const companion = session?.companionId ? getCompanion(session.companionId) : undefined;
  const isJollyMode = session?.mode === "jolly";

  // ── Error / loading states ────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm animate-fade-in">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background: "rgba(225,112,85,0.12)", border: "1px solid rgba(225,112,85,0.25)" }}
          >
            🔍
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-foreground">{t("learn.sessionNotFound")}</h1>
            <p className="text-sm text-muted leading-relaxed">
              This learning session doesn&apos;t exist or may have been removed. Start a new session from your library.
            </p>
          </div>
          <Link
            href="/my-learnings"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, #8b7cf8 100%)",
              boxShadow: "0 4px 14px rgba(108,92,231,0.35)",
            }}
          >
            {t("learn.goToMyLearnings")}
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-muted text-sm">{t("learn.loadingSession")}</span>
        </div>
      </div>
    );
  }

  const activeBreakpoint =
    activeBreakpointIndex !== null
      ? session.translatedContent.breakpoints[activeBreakpointIndex]
      : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Keyframes ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes progress-fill {
          from { width: 0%; }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cert-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .cert-btn-shimmer {
          background: linear-gradient(
            90deg,
            var(--success) 0%,
            #00d4a8 40%,
            #a8ffeb 50%,
            #00d4a8 60%,
            var(--success) 100%
          );
          background-size: 200% auto;
          animation: cert-shimmer 2.4s linear infinite;
        }
      `}</style>

      <div
        className="min-h-screen bg-background"
        dir={isRTL(session.targetLocale) ? "rtl" : "ltr"}
      >
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-40 border-b border-border"
          style={{
            background: "rgba(15,15,19,0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-4 px-4 sm:px-6 h-14">
            {/* Back button */}
            <Link
              href="/my-learnings"
              className="
                inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5
                text-sm font-medium text-muted hover:text-foreground
                hover:bg-surface-light
                transition-colors duration-150
                focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:outline-none
                shrink-0
              "
              aria-label="Back to My Learnings"
            >
              <BackIcon />
              <span className="hidden sm:inline">{t("learn.backToMyLearnings")}</span>
            </Link>

            {/* Divider */}
            <div className="w-px h-5 bg-border shrink-0" aria-hidden="true" />

            {/* Video title */}
            <h1 className="flex-1 text-sm font-semibold text-foreground truncate leading-tight">
              {session.metadata.title}
            </h1>

            {/* Progress badge */}
            {totalBreakpoints > 0 && (
              <div
                className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: allBreakpointsCleared
                    ? "rgba(0,184,148,0.15)"
                    : "rgba(108,92,231,0.15)",
                  color: allBreakpointsCleared ? "var(--success)" : "var(--primary-light)",
                  border: `1px solid ${
                    allBreakpointsCleared
                      ? "rgba(0,184,148,0.3)"
                      : "rgba(108,92,231,0.3)"
                  }`,
                  animation: "badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
                aria-label={`${clearedCount} of ${totalBreakpoints} breakpoints cleared`}
              >
                <span aria-hidden="true">{allBreakpointsCleared ? "✓" : "◆"}</span>
                {clearedCount}/{totalBreakpoints}
              </div>
            )}

            {/* Certificate button — only when final quiz passed */}
            {finalQuizPassed && (
              <Link
                href={`/certificate/${session.id}`}
                className="
                  cert-btn-shimmer
                  shrink-0 inline-flex items-center gap-1.5
                  rounded-lg px-3 py-1.5
                  text-xs font-bold text-white
                  transition-all duration-200
                  shadow-[0_4px_14px_rgba(0,184,148,0.4)]
                  hover:shadow-[0_4px_20px_rgba(0,184,148,0.6)]
                  focus-visible:ring-2 focus-visible:ring-success focus-visible:outline-none
                "
                aria-label="View your completion certificate"
              >
                <TrophyIcon />
                <span className="hidden sm:inline">{t("learn.certificate")}</span>
              </Link>
            )}
          </div>

          {/* ── Segmented progress track ──────────────────────────────────── */}
          {totalBreakpoints > 0 && (
            <div
              className="max-w-5xl mx-auto px-4 sm:px-6 pb-2.5 flex items-center gap-1.5"
              aria-label={`Progress: ${clearedCount} of ${totalBreakpoints} checkpoints completed`}
              role="progressbar"
              aria-valuenow={clearedCount}
              aria-valuemin={0}
              aria-valuemax={totalBreakpoints}
            >
              {breakpointsCleared.map((cleared, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(45,45,68,0.7)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: cleared ? "100%" : "0%",
                      background: cleared
                        ? "linear-gradient(90deg, var(--success), #00d4a8)"
                        : "transparent",
                      animation: cleared ? "progress-fill 0.5s ease-out" : "none",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </header>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">

          {/* ── Video player ─────────────────────────────────────────────── */}
          <section aria-label="Video player">
            <VideoPlayer
              ref={videoPlayerRef}
              videoUrl={session.videoUrl}
              breakpoints={session.translatedContent.breakpoints}
              translatedSubtitles={session.translatedContent.transcript}
              targetLocale={session.targetLocale}
              onBreakpointReached={handleBreakpointReached}
              breakpointsCleared={session.progress.breakpointsCleared}
              onProgressUpdate={handleProgressUpdate}
              originalSubtitles={session.originalTranscript}
              sourceLocale={session.sourceLocale}
              onEnd={handleVideoEnd}
            />
          </section>

          {/* ── Session meta row ─────────────────────────────────────────── */}
          <section
            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border p-4"
            style={{ background: "rgba(26,26,36,0.6)" }}
            aria-label="Session information"
          >
            {/* Left: mode + companion */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Mode badge */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0"
                style={{
                  background:
                    session.mode === "jolly"
                      ? "rgba(0,206,201,0.12)"
                      : "rgba(108,92,231,0.12)",
                  color:
                    session.mode === "jolly" ? "var(--accent)" : "var(--primary-light)",
                  border: `1px solid ${
                    session.mode === "jolly"
                      ? "rgba(0,206,201,0.25)"
                      : "rgba(108,92,231,0.25)"
                  }`,
                }}
              >
                {session.mode === "jolly" ? "🎉 Jolly" : "🎯 Focus"}
              </span>

              {companion && (
                <span className="text-xs text-muted truncate">
                  {t("common.with")}{" "}
                  <span className="text-foreground font-medium">{t(companion.name as any)}</span>
                </span>
              )}
            </div>

            {/* Right: language switcher + metadata */}
            <div className="flex items-center gap-4 text-xs text-muted shrink-0">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true">🌐</span>
                <span>{session.sourceLocale.toUpperCase()}</span>
                <span aria-hidden="true">→</span>
                <select
                  value={session.targetLocale}
                  disabled={isTranslating || quizVisible}
                  onChange={async (e) => {
                    const newLocale = e.target.value;
                    if (newLocale === session.targetLocale) return;

                    // Invalidate any in-progress or cached final quiz
                    finalQuizGenerationRef.current.abortController?.abort();
                    finalQuizGenerationRef.current.inProgress = false;
                    finalQuizGenerationRef.current.abortController = null;

                    setIsTranslating(true);
                    try {
                      const breakpointsToSend = session.originalBreakpoints ?? session.translatedContent.breakpoints;
                      const res = await fetch("/api/translate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          transcript: session.originalTranscript,
                          breakpoints: breakpointsToSend,
                          sourceLocale: session.sourceLocale,
                          targetLocale: newLocale,
                        }),
                      });
                      const data = (await res.json()) as { translatedContent: TranslatedContent; fallback?: boolean };
                      if (data.fallback) throw new Error("Translation fallback returned");
                      
                      // Clear cached final quiz so it regenerates for new locale
                      updateSession(session.id, {
                        targetLocale: newLocale,
                        translatedContent: data.translatedContent,
                        finalQuiz: undefined,
                      });
                      setSession((prev) => {
                        if (!prev) return prev;
                        const { finalQuiz: _, ...rest } = prev;
                        return { ...rest, targetLocale: newLocale, translatedContent: data.translatedContent };
                      });

                      // Re-trigger background generation if all breakpoints cleared
                      const currentCleared = session.progress.breakpointsCleared;
                      const allBpCleared = currentCleared.length > 0 && currentCleared.every(Boolean);
                      if (allBpCleared) {
                        // Delay slightly to let state settle
                        setTimeout(() => generateFinalQuizInBackground(), 100);
                      }
                    } catch {
                      // Revert select on failure — state is unchanged
                      alert("Translation service is currently unavailable. Please try again later.");
                    } finally {
                      setIsTranslating(false);
                    }
                  }}
                  className="bg-surface-light border border-border text-foreground rounded-lg text-xs px-2 py-1 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.entries(LANGUAGE_REGIONS).map(([region, langs]) => (
                    <optgroup key={region} label={region}>
                      {langs
                        .filter((l) => l.code !== session.sourceLocale)
                        .map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                {isTranslating && (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                )}
              </span>
              {session.metadata.channelName && (
                <span className="hidden sm:inline truncate max-w-[160px]">
                  {session.metadata.channelName}
                </span>
              )}
            </div>
          </section>

          {/* ── Breakpoints list ─────────────────────────────────────────── */}
          {totalBreakpoints > 0 && (
            <section aria-label="Learning checkpoints">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                {t("learn.checkpoints")}
              </h2>
              <div className="flex flex-col gap-2">
                {session.translatedContent.breakpoints.map((bp, i) => {
                  const cleared = session.progress.breakpointsCleared[i] ?? false;
                  const attempts = session.progress.attemptsPerBreakpoint[i] ?? 0;
                  const isActive = activeBreakpointIndex === i && quizVisible;

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300"
                      style={{
                        borderColor: isActive
                          ? "rgba(108,92,231,0.5)"
                          : cleared
                          ? "rgba(0,184,148,0.25)"
                          : "rgba(45,45,68,0.8)",
                        background: isActive
                          ? "rgba(108,92,231,0.08)"
                          : cleared
                          ? "rgba(0,184,148,0.05)"
                          : "rgba(26,26,36,0.4)",
                        boxShadow: isActive
                          ? "0 0 0 1px rgba(108,92,231,0.3)"
                          : "none",
                      }}
                    >
                      {/* Status icon */}
                      <div
                        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition-all duration-300"
                        style={{
                          background: cleared
                            ? "rgba(0,184,148,0.2)"
                            : isActive
                            ? "rgba(108,92,231,0.25)"
                            : "rgba(45,45,68,0.5)",
                          color: cleared
                            ? "var(--success)"
                            : isActive
                            ? "var(--primary-light)"
                            : "var(--muted)",
                          border: `1.5px solid ${
                            cleared
                              ? "rgba(0,184,148,0.4)"
                              : isActive
                              ? "rgba(108,92,231,0.5)"
                              : "rgba(45,45,68,0.6)"
                          }`,
                        }}
                        aria-hidden="true"
                      >
                        {cleared ? "✓" : i + 1}
                      </div>

                      {/* Topic */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium leading-tight truncate"
                          style={{
                            color: cleared
                              ? "var(--success)"
                              : isActive
                              ? "var(--foreground)"
                              : "var(--muted)",
                          }}
                        >
                          {bp.topic}
                        </p>
                        {attempts > 0 && !cleared && (
                          <p className="text-xs text-muted mt-0.5">
                            {attempts} {attempts !== 1 ? t("learn.attempts") : t("learn.attempt")}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-muted shrink-0 tabular-nums">
                        {formatTime(bp.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Final quiz banner — shows after all breakpoints cleared ────── */}
          {allBreakpointsCleared && !finalQuizPassed && (
            <section
              className="rounded-2xl border p-6 text-center flex flex-col items-center gap-4 animate-slide-up"
              style={{
                borderColor: "rgba(108,92,231,0.3)",
                background:
                  "linear-gradient(135deg, rgba(108,92,231,0.08) 0%, rgba(139,124,248,0.05) 100%)",
              }}
              aria-label="Final quiz"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: "rgba(108,92,231,0.15)",
                  border: "2px solid rgba(108,92,231,0.3)",
                  boxShadow: "0 0 32px rgba(108,92,231,0.15)",
                }}
              >
                📝
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold" style={{ color: "var(--primary-light)" }}>
                  {t("learn.finalQuiz")}
                </h2>
                <p className="text-sm text-muted">
                  {t("learn.finalQuizDesc")}
                </p>
              </div>
              <button
                onClick={handleTakeFinalQuiz}
                disabled={isGeneratingFinalQuiz}
                className="
                  inline-flex items-center gap-2
                  rounded-xl px-6 py-3
                  text-sm font-bold text-white
                  shadow-[0_4px_20px_rgba(108,92,231,0.4)]
                  hover:shadow-[0_4px_28px_rgba(108,92,231,0.6)]
                  transition-shadow duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed
                  focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:outline-none
                "
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, #8b7cf8 100%)",
                }}
              >
                {isGeneratingFinalQuiz ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {t("learn.generating")}
                  </>
                ) : (
                  <>
                    <TrophyIcon />
                    {t("learn.takeFinalQuiz")}
                  </>
                )}
              </button>
              {finalQuizGenError && (
                <p className="text-xs mt-1" style={{ color: "var(--error, #e17055)" }}>
                  {t("learn.finalQuizError")}
                </p>
              )}
            </section>
          )}

          {/* ── Completion banner — only when final quiz passed ────────────── */}
          {finalQuizPassed && (
            <section
              className="rounded-2xl border p-6 text-center flex flex-col items-center gap-4 animate-slide-up"
              style={{
                borderColor: "rgba(0,184,148,0.3)",
                background:
                  "linear-gradient(135deg, rgba(0,184,148,0.08) 0%, rgba(0,206,201,0.05) 100%)",
              }}
              aria-label="Completion message"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: "rgba(0,184,148,0.15)",
                  border: "2px solid rgba(0,184,148,0.3)",
                  boxShadow: "0 0 32px rgba(0,184,148,0.15)",
                }}
              >
                🎓
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-success">
                  {session.translatedContent.companionDialogue.videoComplete ||
                    t("learn.sessionCompleted")}
                </h2>
                <p className="text-sm text-muted">
                  {t("learn.certReady")}
                </p>
              </div>
              <Link
                href={`/certificate/${session.id}`}
                className="
                  cert-btn-shimmer
                  inline-flex items-center gap-2
                  rounded-xl px-6 py-3
                  text-sm font-bold text-white
                  shadow-[0_4px_20px_rgba(0,184,148,0.4)]
                  hover:shadow-[0_4px_28px_rgba(0,184,148,0.6)]
                  transition-shadow duration-200
                  focus-visible:ring-2 focus-visible:ring-success focus-visible:outline-none
                "
              >
                <TrophyIcon />
                {t("learn.viewCertificate")}
              </Link>
            </section>
          )}
        </main>
      </div>

      {/* ── Quiz popup (portal) ───────────────────────────────────────────── */}
      {quizVisible && activeBreakpoint && (
        <QuizPopup
          breakpoint={activeBreakpoint}
          breakpointIndex={activeBreakpointIndex!}
          totalBreakpoints={totalBreakpoints}
          targetLocale={session.targetLocale}
          onPass={handleQuizPass}
          onClose={handleQuizClose}
          isRetry={isRetry}
        />
      )}

      {/* ── Final quiz popup ─────────────────────────────────────────────── */}
      {finalQuizVisible && session.finalQuiz && (
        <QuizPopup
          breakpoint={session.finalQuiz}
          breakpointIndex={0}
          totalBreakpoints={1}
          targetLocale={session.targetLocale}
          onPass={handleFinalQuizPass}
          onClose={handleFinalQuizClose}
          isRetry={finalQuizIsRetry}
          isFinalQuiz={true}
        />
      )}

      {/* ── Companion (jolly mode only, companion selected) ──────────────── */}
      {isJollyMode && companion && (
        <>
          <CursorFollower companionId={companion.id} state={companionState} />
          <SpeechBubble
            text={speechText}
            visible={speechVisible}
            position={cursorHasMoved.current
              ? cursorPos
              : { x: Math.max(20, window.innerWidth / 2 - 110), y: window.innerHeight - 180 }}
          />
        </>
      )}
    </>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
