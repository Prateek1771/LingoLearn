"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isRTL } from "@/lib/languages";
import type { Breakpoint, QuizQuestion } from "@/lib/types";
import QuizOption from "./QuizOption";
import { useTranslation } from "@/contexts/UILanguageContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuizPopupProps {
  breakpoint: Breakpoint;
  breakpointIndex: number;
  totalBreakpoints: number;
  targetLocale: string;
  onPass: () => void;
  onClose: () => void;
  isRetry: boolean;
  isFinalQuiz?: boolean;
}

// Internal per-question answer state
interface AnswerState {
  selectedIndex: number | null;
  isRevealed: boolean;
  isCorrect: boolean | null;
}

type Phase = "answering" | "reviewing" | "passed" | "failed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialAnswers(count: number): AnswerState[] {
  return Array.from({ length: count }, () => ({
    selectedIndex: null,
    isRevealed: false,
    isCorrect: null,
  }));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated checkmark drawn with SVG stroke-dashoffset trick */
function SuccessCheck() {
  return (
    <svg
      className="mx-auto"
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        stroke="var(--success)"
        strokeWidth="3"
        fill="rgba(0,184,148,0.12)"
        style={{
          animation: "quiz-circle-in 0.4s ease-out forwards",
        }}
      />
      <polyline
        points="18,33 27,42 46,22"
        stroke="var(--success)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: 40,
          animation: "quiz-check-draw 0.35s ease-out 0.25s forwards",
        }}
      />
    </svg>
  );
}

/** Progress dots row showing quiz questions completion */
function ProgressDots({
  total,
  current,
  answers,
}: {
  total: number;
  current: number;
  answers: AnswerState[];
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2" role="list" aria-label="Question progress">
      {Array.from({ length: total }, (_, i) => {
        const answer = answers[i];
        const isDone = answer?.isRevealed;
        const isGood = answer?.isCorrect;
        const isCurrent = i === current && !isDone;

        let dotClass =
          "h-2 rounded-full transition-all duration-300 ";
        if (isDone && isGood) {
          dotClass += "w-5 bg-success";
        } else if (isDone && !isGood) {
          dotClass += "w-5 bg-error";
        } else if (isCurrent) {
          dotClass += "w-5 bg-primary";
        } else {
          dotClass += "w-2 bg-border";
        }

        return (
          <span
            key={i}
            className={dotClass}
            role="listitem"
            aria-label={
              isDone
                ? isGood
                  ? t("quiz.questionCorrect", { index: i + 1 })
                  : t("quiz.questionIncorrect", { index: i + 1 })
                : isCurrent
                ? t("quiz.questionCurrent", { index: i + 1 })
                : t("quiz.questionUpcoming", { index: i + 1 })
            }
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SolutionSummary sub-component
// ---------------------------------------------------------------------------

function SolutionSummary({
  questions,
  answers,
}: {
  questions: QuizQuestion[];
  answers: AnswerState[];
}) {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-col gap-4 mt-2">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider text-center">
        {t("quiz.reviewAnswers")}
      </p>
      {questions.map((q, i) => {
        const a = answers[i];
        const userIndex = a?.selectedIndex ?? null;
        return (
          <div
            key={i}
            className="rounded-xl border border-border px-4 py-3.5 flex flex-col gap-2.5"
            style={{ background: "rgba(37,37,54,0.7)" }}
          >
            {/* Question */}
            <p className="text-xs font-semibold text-foreground leading-relaxed">
              <span className="text-muted mr-1">◆</span>
              {q.question}
            </p>
            {/* Options */}
            <div className="flex flex-col gap-1.5">
              {q.options.map((opt, oi) => {
                const isCorrectOpt = oi === q.correct;
                const isUserPick = oi === userIndex;
                const isWrongPick = isUserPick && !isCorrectOpt;
                if (!isCorrectOpt && !isWrongPick) return null;
                return (
                  <div
                    key={oi}
                    className="flex items-start gap-2 text-xs"
                    style={{
                      color: isCorrectOpt ? "var(--success)" : "var(--error)",
                    }}
                  >
                    <span className="shrink-0 mt-0.5 font-bold">
                      {isCorrectOpt ? "✓" : "✗"}
                    </span>
                    <span className="leading-relaxed">{opt}</span>
                  </div>
                );
              })}
            </div>
            {/* Explanation */}
            {q.explanation && (
              <p className="text-xs text-muted/80 leading-relaxed border-t border-border pt-2">
                💡 {q.explanation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function QuizPopup({
  breakpoint,
  breakpointIndex,
  totalBreakpoints,
  targetLocale,
  onPass,
  onClose,
  isRetry,
  isFinalQuiz = false,
}: QuizPopupProps) {
  const rtl = isRTL(targetLocale);
  const { t } = useTranslation();
  const questions: QuizQuestion[] = isRetry && breakpoint.retryQuestions?.length > 0
    ? breakpoint.retryQuestions
    : breakpoint.primaryQuestions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    buildInitialAnswers(questions.length)
  );
  const [phase, setPhase] = useState<Phase>("answering");
  const [scoreCount, setScoreCount] = useState<{ correct: number; total: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];

  // Focus trap + initial focus
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  // Reset state if breakpoint or retry flag changes
  useEffect(() => {
    setCurrentIndex(0);
    setAnswers(buildInitialAnswers(questions.length));
    setPhase("answering");
    setScoreCount(null);
  }, [breakpoint.topic, breakpoint.timestamp, isRetry, questions.length]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (answers[currentIndex].isRevealed) return;
      setAnswers((prev) =>
        prev.map((a, i) =>
          i === currentIndex ? { ...a, selectedIndex: optionIndex } : a
        )
      );
    },
    [answers, currentIndex]
  );

  const handleSubmit = useCallback(() => {
    if (currentAnswer.selectedIndex === null) return;

    const isCorrect =
      currentAnswer.selectedIndex === currentQuestion.correct;

    setAnswers((prev) =>
      prev.map((a, i) =>
        i === currentIndex
          ? { ...a, isRevealed: true, isCorrect }
          : a
      )
    );
    setPhase("reviewing");
  }, [currentAnswer, currentIndex, currentQuestion.correct]);

  const handleNext = useCallback(() => {
    const isLast = currentIndex === questions.length - 1;

    if (isLast) {
      // Evaluate overall pass / fail
      const updatedAnswers = answers.map((a, i) =>
        i === currentIndex ? { ...a, isRevealed: true } : a
      );
      const correctCount = updatedAnswers.filter((a) => a.isCorrect === true).length;
      const total = updatedAnswers.length;
      setScoreCount({ correct: correctCount, total });
      const PASS_THRESHOLD = isFinalQuiz ? 0.7 : 1.0;
      const passed = correctCount / total >= PASS_THRESHOLD;
      setPhase(passed ? "passed" : "failed");
      if (passed) {
        // Slight delay so the "passed" animation has a moment to render
        setTimeout(() => onPass(), 1800);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
      setPhase("answering");
    }
  }, [answers, currentIndex, onPass, questions.length]);

  const handleTryAgain = useCallback(() => {
    onClose(); // Parent will re-open with isRetry=true
  }, [onClose]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const isSubmitDisabled =
    currentAnswer.selectedIndex === null || currentAnswer.isRevealed;

  const isLastQuestion = currentIndex === questions.length - 1;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* --- Keyframe injections (scoped, avoids globals.css pollution) --- */}
      <style>{`
        @keyframes quiz-backdrop-in {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes quiz-modal-in {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes quiz-circle-in {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes quiz-check-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes quiz-success-pop {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes quiz-fail-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .quiz-success-panel { animation: quiz-success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .quiz-fail-panel    { animation: quiz-fail-shake 0.45s ease-out forwards; }
        .quiz-explanation   { animation: fadeIn 0.3s ease-out; }
      `}</style>

      {/* --- Backdrop --- */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
        style={{
          animation: "quiz-backdrop-in 0.3s ease-out forwards",
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Quiz: ${breakpoint.topic}`}
        dir={rtl ? "rtl" : "ltr"}
      >
        {/* --- Modal panel --- */}
        <div
          ref={modalRef}
          className="relative w-full sm:max-w-lg bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            animation: "quiz-modal-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards",
            maxHeight: "90vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative top gradient stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{
              background:
                "linear-gradient(90deg, var(--primary), var(--accent))",
            }}
            aria-hidden="true"
          />

          {/* ----------------------------------------------------------------
              HEADER
          ---------------------------------------------------------------- */}
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex flex-col gap-1 min-w-0">
              {/* Breakpoint label */}
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: isRetry
                      ? "rgba(253,203,110,0.15)"
                      : "rgba(108,92,231,0.15)",
                    color: isRetry ? "var(--warning)" : "var(--primary-text)",
                    border: `1px solid ${isRetry ? "rgba(253,203,110,0.3)" : "rgba(108,92,231,0.3)"}`,
                  }}
                >
                  {isRetry ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      {t("quiz.retry")}
                    </>
                  ) : (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {t("quiz.quiz")}
                    </>
                  )}
                </span>
                <span className="text-xs text-muted font-medium">
                  {t("quiz.breakpoint", { current: breakpointIndex + 1, total: totalBreakpoints })}
                </span>
              </div>

              {/* Topic title */}
              <h2 className="text-sm font-semibold text-foreground leading-snug truncate">
                {breakpoint.topic}
              </h2>
            </div>

            {/* Close button */}
            <button
              ref={firstFocusRef}
              type="button"
              onClick={onClose}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-foreground hover:bg-surface-light transition-colors duration-150"
              aria-label="Close quiz"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ----------------------------------------------------------------
              BODY (scrollable)
          ---------------------------------------------------------------- */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 flex flex-col gap-5">

            {/* === PASSED PANEL === */}
            {phase === "passed" && (
              <div className="quiz-success-panel flex flex-col items-center gap-4 py-6 text-center">
                <SuccessCheck />
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-bold text-success">
                    {isFinalQuiz ? t("quiz.youPassed") : t("quiz.perfectScore")}
                  </h3>
                  {scoreCount && (
                    <p className="text-sm font-semibold text-success/80">
                      {t("quiz.passedScore", { correct: scoreCount.correct, total: scoreCount.total })}
                    </p>
                  )}
                  {!isFinalQuiz && (
                    <p className="text-sm text-muted max-w-xs">
                      {t("quiz.perfectScoreDesc")}
                    </p>
                  )}
                </div>
                {/* Animated confetti dots */}
                <div className="flex items-center gap-2 mt-1" aria-hidden="true">
                  {["bg-primary", "bg-accent", "bg-success", "bg-warning", "bg-primary-light"].map(
                    (color, i) => (
                      <span
                        key={i}
                        className={`h-2 w-2 rounded-full ${color}`}
                        style={{
                          animation: `quiz-success-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms both`,
                        }}
                      />
                    )
                  )}
                </div>
                {isFinalQuiz && scoreCount && (
                  <SolutionSummary questions={questions} answers={answers} />
                )}
              </div>
            )}

            {/* === FAILED PANEL === */}
            {phase === "failed" && (
              <div className="quiz-fail-panel flex flex-col items-center gap-4 py-6 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full mx-auto"
                  style={{
                    background: "rgba(225,112,85,0.12)",
                    border: "2px solid rgba(225,112,85,0.4)",
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-bold text-error">
                    {t("quiz.notQuite")}
                  </h3>
                  {isFinalQuiz && scoreCount ? (
                    <p className="text-sm text-muted max-w-xs">
                      {t("quiz.failedScore", {
                        correct: scoreCount.correct,
                        total: scoreCount.total,
                        required: Math.ceil(scoreCount.total * 0.7),
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted max-w-xs">
                      {t("quiz.notQuiteDesc")}
                    </p>
                  )}
                </div>
                {isFinalQuiz && scoreCount && (
                  <SolutionSummary questions={questions} answers={answers} />
                )}
              </div>
            )}

            {/* === QUESTION AREA (answering / reviewing) === */}
            {(phase === "answering" || phase === "reviewing") && currentQuestion && (
              <>
                {/* Progress dots */}
                {questions.length > 1 && (
                  <ProgressDots
                    total={questions.length}
                    current={currentIndex}
                    answers={answers}
                  />
                )}

                {/* Question counter */}
                <p className="text-xs text-muted font-medium text-center">
                  {t("quiz.questionOf", { current: currentIndex + 1, total: questions.length })}
                </p>

                {/* Question text */}
                <div
                  className="rounded-xl border border-border bg-surface-light px-4 py-3.5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(37,37,54,0.8) 0%, rgba(26,26,36,0.9) 100%)",
                  }}
                >
                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-2.5">
                  {currentQuestion.options.map((option, i) => {
                    const isCorrectOption =
                      currentAnswer.isRevealed &&
                      i === currentQuestion.correct;
                    const isIncorrectSelected =
                      currentAnswer.isRevealed &&
                      currentAnswer.selectedIndex === i &&
                      i !== currentQuestion.correct;

                    return (
                      <QuizOption
                        key={i}
                        text={option}
                        index={i}
                        isSelected={currentAnswer.selectedIndex === i}
                        isCorrect={
                          isCorrectOption
                            ? true
                            : isIncorrectSelected
                            ? false
                            : null
                        }
                        isRevealed={currentAnswer.isRevealed}
                        onSelect={handleSelect}
                      />
                    );
                  })}
                </div>

                {/* Explanation (shown after submit) */}
                {currentAnswer.isRevealed && currentQuestion.explanation && (
                  <div
                    className="quiz-explanation rounded-xl border px-4 py-3.5 flex gap-3"
                    style={{
                      borderColor: currentAnswer.isCorrect
                        ? "rgba(0,184,148,0.35)"
                        : "rgba(225,112,85,0.35)",
                      background: currentAnswer.isCorrect
                        ? "rgba(0,184,148,0.07)"
                        : "rgba(225,112,85,0.07)",
                    }}
                  >
                    <span
                      className="shrink-0 mt-0.5"
                      style={{
                        color: currentAnswer.isCorrect
                          ? "var(--success)"
                          : "var(--error)",
                      }}
                      aria-hidden="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </span>
                    <p className="text-xs leading-relaxed text-foreground/80">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ----------------------------------------------------------------
              FOOTER — actions
          ---------------------------------------------------------------- */}
          <div className="shrink-0 border-t border-border px-5 py-4 flex gap-3">
            {/* Answering phase: Submit */}
            {phase === "answering" && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isSubmitDisabled
                    ? "var(--surface-light)"
                    : "linear-gradient(135deg, var(--primary) 0%, #8b7cf8 100%)",
                  boxShadow: isSubmitDisabled
                    ? "none"
                    : "0 4px 14px rgba(108,92,231,0.35)",
                }}
              >
                {t("quiz.submitAnswer")}
              </button>
            )}

            {/* Reviewing phase: Next / Finish */}
            {phase === "reviewing" && (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200"
                style={{
                  background: currentAnswer.isCorrect
                    ? "linear-gradient(135deg, var(--success) 0%, #00d4a8 100%)"
                    : "linear-gradient(135deg, var(--primary) 0%, #8b7cf8 100%)",
                  boxShadow: currentAnswer.isCorrect
                    ? "0 4px 14px rgba(0,184,148,0.35)"
                    : "0 4px 14px rgba(108,92,231,0.35)",
                }}
              >
                {isLastQuestion ? t("quiz.seeResults") : t("quiz.nextQuestion")}
              </button>
            )}

            {/* Passed phase: Continue (auto-closes, but give user manual control) */}
            {phase === "passed" && (
              <button
                type="button"
                onClick={onPass}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, var(--success) 0%, #00d4a8 100%)",
                  boxShadow: "0 4px 14px rgba(0,184,148,0.35)",
                }}
              >
                {t("quiz.continue")}
              </button>
            )}

            {/* Failed phase: Try Again + Close */}
            {phase === "failed" && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground hover:border-border/70 transition-colors duration-150"
                >
                  {t("quiz.close")}
                </button>
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--warning) 0%, #f0b429 100%)",
                    boxShadow: "0 4px 14px rgba(253,203,110,0.3)",
                    color: "#1a1a24",
                  }}
                >
                  {t("quiz.tryAgain")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
