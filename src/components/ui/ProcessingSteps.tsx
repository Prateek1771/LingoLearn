"use client";

import { useTranslation } from "@/contexts/UILanguageContext";

interface ProcessingStepsProps {
  currentStep: number;
  error: string | null;
  targetLanguageName: string;
  onDismiss?: () => void;
}

const STEP_ICONS = {
  extract: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 4.5h12M3 9h9M3 13.5h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  detect: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 6v3l2 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  analyze: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M2.25 13.5l4.5-6 3 3.75 2.25-3 3.75 5.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  quiz: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 6.75h.01M6 9h.01M6 11.25h.01M7.5 6.75h4.5M7.5 9h4.5M7.5 11.25h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  translate: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M2.25 4.5h7.5M6 2.25V4.5M3.75 4.5C3.75 7.12 5.25 9.375 7.5 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 15.75l2.25-6 2.25 6M10.5 13.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ready: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1.5L11.163 6.3l5.337.675-3.9 3.675.975 5.25L9 13.275 5.325 15.9l.975-5.25L2.4 6.975l5.337-.675L9 1.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default function ProcessingSteps({
  currentStep,
  error,
  targetLanguageName,
  onDismiss,
}: ProcessingStepsProps) {
  const { t } = useTranslation();

  const steps = [
    {
      id: "extract",
      label: t("processing.extracting"),
      icon: STEP_ICONS.extract,
    },
    {
      id: "detect",
      label: t("processing.detecting"),
      icon: STEP_ICONS.detect,
    },
    {
      id: "analyze",
      label: t("processing.analyzing"),
      icon: STEP_ICONS.analyze,
    },
    {
      id: "quiz",
      label: t("processing.generating"),
      icon: STEP_ICONS.quiz,
    },
    {
      id: "translate",
      label: t("processing.translatingWith", { 
        language: targetLanguageName, 
        brand: "Lingo.dev" 
      }),
      icon: STEP_ICONS.translate,
    },
    {
      id: "ready",
      label: t("processing.ready"),
      icon: STEP_ICONS.ready,
    },
  ];

  const errorStepIndex = error !== null ? currentStep : -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 15, 19, 0.92)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="animate-slide-up w-full max-w-md rounded-2xl border p-8"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "0 0 60px rgba(108, 92, 231, 0.15)",
        }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, var(--primary), var(--accent))",
              boxShadow: "0 0 24px rgba(108, 92, 231, 0.4)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" style={{ color: "white" }}>
              <path
                d="M13 2L15.9 8.26L23 9.27L18 14.14L19.18 21.02L13 17.77L6.82 21.02L8 14.14L3 9.27L10.1 8.26L13 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            {t("processing.buildingLesson")}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {t("processing.timeEstimate")}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = index === currentStep && !error;
            const isDone = index < currentStep && !error;
            const isErrored = index === errorStepIndex && error !== null;
            const isPending = index > currentStep || (error !== null && index > errorStepIndex);

            return (
              <div
                key={step.id}
                className="flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300"
                style={{
                  background: isActive
                    ? "rgba(108, 92, 231, 0.12)"
                    : isErrored
                    ? "rgba(225, 112, 85, 0.1)"
                    : isDone
                    ? "rgba(0, 184, 148, 0.06)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(108, 92, 231, 0.25)"
                    : isErrored
                    ? "1px solid rgba(225, 112, 85, 0.25)"
                    : isDone
                    ? "1px solid rgba(0, 184, 148, 0.15)"
                    : "1px solid transparent",
                  boxShadow: isActive ? "0 0 12px rgba(108, 92, 231, 0.1)" : "none",
                }}
              >
                {/* Step indicator */}
                <div className="flex-shrink-0">
                  {isActive && (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full animate-pulse-glow"
                      style={{ background: "var(--primary)" }}
                    >
                      <SpinnerIcon />
                    </div>
                  )}
                  {isDone && (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: "rgba(0, 184, 148, 0.15)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--success)" }}>
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                  {isErrored && (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: "rgba(225, 112, 85, 0.15)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--error)" }}>
                        <path
                          d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                  {isPending && (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: "var(--surface-light)", color: "var(--border)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: isActive
                        ? "var(--foreground)"
                        : isDone
                        ? "var(--success)"
                        : isErrored
                        ? "var(--error)"
                        : "var(--muted)",
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Step icon (decorative) */}
                {(isActive || isDone) && (
                  <div
                    className="flex-shrink-0 opacity-40"
                    style={{ color: isDone ? "var(--success)" : "var(--primary-light)" }}
                  >
                    {step.icon}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          className="mt-6 h-1.5 overflow-hidden rounded-full"
          style={{ background: "var(--surface-light)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(100, (currentStep / (steps.length - 1)) * 100)}%`,
              background: error
                ? "var(--error)"
                : "linear-gradient(90deg, var(--primary), var(--accent))",
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            className="animate-fade-in mt-5 rounded-xl p-4"
            style={{
              background: "rgba(225, 112, 85, 0.08)",
              border: "1px solid rgba(225, 112, 85, 0.2)",
            }}
          >
            <div className="flex items-start gap-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="mt-0.5 flex-shrink-0"
                style={{ color: "var(--error)" }}
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm leading-relaxed" style={{ color: "var(--error)" }}>
                {error}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="mt-4 w-full py-2 text-sm font-bold pixel-border transition-colors"
                style={{ background: "var(--surface-light)", color: "var(--foreground)" }}
              >
                ✕ Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{
        color: "white",
        animation: "spin 0.8s linear infinite",
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <circle
        cx="7"
        cy="7"
        r="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="20 10"
      />
    </svg>
  );
}
