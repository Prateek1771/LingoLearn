"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { COMPANIONS } from "@/lib/companions";
import { getAllLanguages } from "@/lib/languages";
import type { LearningMode } from "@/lib/types";
import type {
  TranscriptSegment,
  VideoMetadata,
  QuizFrequency,
  Breakpoint,
  TranslatedContent,
} from "@/lib/types";
import { createSession } from "@/lib/session";
import LanguageSelector from "@/components/ui/LanguageSelector";
import ProcessingSteps from "@/components/ui/ProcessingSteps";
import { useTranslation } from "@/contexts/UILanguageContext";

const COMPANION_EMOJIS: Record<string, string> = {
  fox: "🦊",
  owl: "🦉",
  cat: "🐱",
  robot: "🤖",
};

const DEFAULT_LANGUAGE = "es";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--background)" }} />}>
      <HomePageInner />
    </Suspense>
  );
}

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  // Form state
  const [url, setUrl] = useState("");

  // Pre-fill URL from explore page navigation (?url=...)
  useEffect(() => {
    const prefilledUrl = searchParams.get("url");
    if (prefilledUrl) {
      setUrl(decodeURIComponent(prefilledUrl));
    }
  }, [searchParams]);
  const [targetLocale, setTargetLocale] = useState(DEFAULT_LANGUAGE);
  const [mode, setMode] = useState<LearningMode>("jolly");
  const [companionId, setCompanionId] = useState<string>(COMPANIONS[0].id);
  const selectedCompanion = COMPANIONS.find(c => c.id === companionId) || COMPANIONS[0];
  const [userName, setUserName] = useState("");
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [typedLore, setTypedLore] = useState("");

  // Typewriter effect logic
  useEffect(() => {
    if (mode === "jolly" && selectedCompanion?.description) {
      setTypedLore(""); // reset
      let i = 0;
      const text = t(selectedCompanion.description as any);
      const interval = setInterval(() => {
        setTypedLore(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 30); // typing speed
      return () => clearInterval(interval);
    }
  }, [companionId, mode, selectedCompanion?.description, t]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const selectedLanguage = getAllLanguages().find((l) => l.code === targetLocale);
  const targetLanguageName = selectedLanguage?.name ?? targetLocale;

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      // Clipboard read failed — ignore silently
    }
  }, []);

  const isValidYouTubeUrl = (value: string) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/.test(
      value.trim()
    );
  };

  const canStart = url.trim().length > 0 && userName.trim().length > 0;

  async function handleStart() {
    if (!canStart) return;

    if (!isValidYouTubeUrl(url)) {
      setProcessingError(t("home.invalidUrl"));
      setIsProcessing(true);
      setCurrentStep(0);
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);
    setCurrentStep(0);

    try {
      // Step 0 + 1: Extract transcript & detect language
      const extractRes = await fetch("/api/extract-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!extractRes.ok) {
        const data = await extractRes.json();
        throw new Error(data.error || "Failed to extract transcript");
      }

      const extractData = (await extractRes.json()) as {
        transcript: TranscriptSegment[];
        metadata: VideoMetadata;
        detectedLocale: string;
        quizFrequency: QuizFrequency;
      };

      setCurrentStep(2);

      // Step 2: Analyze learning moments + Step 3: Generate quizzes (first 20 min only)
      const INITIAL_WINDOW = 20 * 60;
      const duration = extractData.metadata.duration;
      const initialEnd = Math.min(INITIAL_WINDOW, duration);
      const initialMaxBp = Math.max(
        1,
        Math.ceil(extractData.quizFrequency.maxBreakpoints * (initialEnd / duration))
      );

      const quizzesRes = await fetch("/api/generate-quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: extractData.transcript,
          maxBreakpoints: initialMaxBp,
          questionsPerBreakpoint: extractData.quizFrequency.questionsPerBreakpoint,
          startTime: 0,
          endTime: initialEnd,
        }),
      });

      if (!quizzesRes.ok) {
        const data = await quizzesRes.json();
        throw new Error(data.error || "Failed to generate quizzes");
      }

      const quizzesData = (await quizzesRes.json()) as { breakpoints: Breakpoint[] };
      setCurrentStep(4);

      // Step 4: Translate
      const translateRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: extractData.transcript,
          breakpoints: quizzesData.breakpoints,
          sourceLocale: extractData.detectedLocale,
          targetLocale,
        }),
      });

      if (!translateRes.ok) {
        const data = await translateRes.json();
        throw new Error(data.error || "Failed to translate content");
      }

      const translateData = (await translateRes.json()) as {
        translatedContent: TranslatedContent;
        fallback?: boolean;
      };

      // Always keep the user's selected target locale, even if translation fell back
      const finalTargetLocale = targetLocale;

      // Warn user if translation service was unavailable
      if (translateData.fallback && targetLocale !== extractData.detectedLocale) {
        console.warn("Translation service unavailable — subtitles will be in the original language");
      }
      setCurrentStep(5);

      // Step 5: Create session and redirect
      const session = createSession({
        videoUrl: url.trim(),
        metadata: extractData.metadata,
        sourceLocale: extractData.detectedLocale,
        targetLocale: finalTargetLocale,
        mode,
        companionId: mode === "jolly" ? companionId : null,
        originalTranscript: extractData.transcript,
        translatedContent: translateData.translatedContent,
        originalBreakpoints: quizzesData.breakpoints,
        quizFrequency: extractData.quizFrequency,
        userName: userName.trim(),
        rawTranscript: extractData.transcript,
        quizzesGeneratedUpTo: initialEnd,
      });

      // Brief pause so "Ready!" is visible
      await new Promise((r) => setTimeout(r, 700));

      router.push(`/learn/${session.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setProcessingError(message);
    }
  }

  return (
    <>
      <div
        className={`relative min-h-screen overflow-x-hidden ${mode === 'focus' ? 'focus-mode-static' : ''}`}
      >
        <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:py-24">
          {/* Hero */}
          <section className="animate-fade-in mb-12 text-center">
            <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl pixel-text mb-6">
              <span
                style={{
                  color: "var(--foreground)",
                }}
              >
                {t("common.appName", { defaultValue: "LingoDev" })}
              </span>
            </h1>

            <p
              className="mt-4 text-xl sm:text-2xl font-medium pixel-text"
              style={{ color: "var(--foreground)" }}
            >
              {t("home.tagline")}
            </p>

            <p
              className="mt-4 text-lg max-w-sm mx-auto leading-relaxed pixel-text"
              style={{ color: "var(--foreground)", background: "rgba(255,255,255,0.7)", padding: "8px", border: "2px solid var(--border)" }}
            >
              {t("home.learnPageHeroDesc")}
            </p>
          </section>

          {/* Card */}
          <div
            className="animate-slide-up p-6 sm:p-8 space-y-6 glass-panel pixel-border"
          >
            {/* URL Input */}
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {t("home.youtubeUrl")}
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full py-3 pl-4 pr-12 text-lg outline-none transition-all pixel-border"
                  style={{
                    background: "var(--surface-light)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--primary-light)";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(108, 92, 231, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <rect x="5" y="1" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path
                      d="M3 4H2.5C1.67 4 1 4.67 1 5.5v7C1 13.33 1.67 14 2.5 14h7c.83 0 1.5-.67 1.5-1.5V12"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Language Selector trigger */}
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {t("home.learnIn")}
              </label>
              <button
                type="button"
                onClick={() => setShowLangSelector(true)}
                className="flex w-full items-center justify-between px-4 py-3 text-lg transition-all pixel-border"
                style={{
                  background: "var(--surface-light)",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center text-sm font-bold pixel-border"
                    style={{
                      background: "var(--primary)",
                      color: "white",
                    }}
                  >
                    {selectedLanguage?.code.toUpperCase().slice(0, 2) ?? "??"}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">{selectedLanguage?.name ?? t("home.selectLanguage")}</div>
                    {selectedLanguage && (
                      <div className="text-sm" style={{ color: "var(--muted)" }}>
                        {selectedLanguage.nativeName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                    {t("home.feature130")}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--muted)" }}>
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Mode Toggle */}
            <div>
              <label
                className="mb-2 block text-sm font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {t("home.learningMode")}
              </label>
              <div
                className="grid grid-cols-2 gap-2 p-1 pixel-border"
                style={{ background: "var(--surface-light)" }}
              >
                <ModeButton
                  value="jolly"
                  current={mode}
                  onClick={() => setMode("jolly")}
                  icon="🎮"
                  label={t("home.modeJolly")}
                  description={t("home.modeJollyDesc")}
                />
                <ModeButton
                  value="focus"
                  current={mode}
                  onClick={() => setMode("focus")}
                  icon="🎯"
                  label={t("home.modeFocus")}
                  description={t("home.modeFocusDesc")}
                />
              </div>
            </div>

            {/* Companion Picker — Jolly only */}
            {mode === "jolly" && (
              <div className="animate-fade-in space-y-3">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("setup.chooseCompanion")}
                </label>
                
                {/* Grid Character Selection Thumbnails */}
                <div className="flex flex-wrap gap-2 pb-2 justify-center">
                  {COMPANIONS.map((companion) => {
                    const isSelected = companionId === companion.id;
                    return (
                      <button
                        key={companion.id}
                        type="button"
                        onClick={() => setCompanionId(companion.id)}
                        className="flex flex-col items-center gap-1.5 rounded-xl py-2 px-3 transition-all flex-shrink-0"
                        style={{
                          background: isSelected
                            ? "rgba(255, 255, 255, 0.9)"
                            : "var(--surface-light)",
                          border: isSelected
                            ? "2px solid var(--primary)"
                            : "1.5px solid var(--border)",
                          boxShadow: isSelected
                            ? "0 4px 12px rgba(9, 132, 227, 0.2)"
                            : "none",
                        }}
                      >
                        <span
                          className="text-sm font-bold"
                          style={{ color: isSelected ? "var(--primary)" : "var(--muted)" }}
                        >
                          {t(companion.name as any).split(',')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Character Detail Card */}
                <div 
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 items-center pixel-border transition-colors duration-500"
                  style={{
                    background: "var(--surface)",
                  }}
                >
                  <div className="col-span-1 flex justify-center items-center p-2 h-40 pixel-border transition-colors duration-500" style={{ background: "var(--surface-light)" }}>
                    <img 
                      src={selectedCompanion.idleGif} 
                      alt={selectedCompanion.name} 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="col-span-2 flex flex-col justify-center h-full min-h-[8rem]">
                    <h3 className="font-extrabold text-2xl mb-1" style={{ color: "var(--primary)" }}>
                      {t(selectedCompanion.name as any)}
                    </h3>
                    <p className="text-lg mt-2 flex-grow" style={{ color: "var(--foreground)", minHeight: "6rem", lineHeight: "1.4" }}>
                      {typedLore}
                      <span className="inline-block w-2 h-4 ml-1 animate-pulse" style={{ background: "var(--primary)" }}></span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label
                className="mb-2 block text-sm font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {t("home.yourName")}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                placeholder={t("home.namePlaceholder")}
                className="w-full py-3 px-4 text-lg outline-none transition-all pixel-border"
                style={{
                  background: "var(--surface-light)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className="relative w-full overflow-hidden py-4 text-xl font-bold transition-all duration-200 pixel-border"
              style={{
                background: canStart
                  ? "var(--primary)"
                  : "var(--surface-light)",
                color: canStart ? "white" : "var(--muted)",
                cursor: canStart ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (canStart) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "4px 6px 0px rgba(0, 0, 0, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (canStart) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "2px 2px 0px rgba(0, 0, 0, 0.3)";
                }
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M6 4.5L13.5 9 6 13.5V4.5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    fill="currentColor"
                    fillOpacity="0.2"
                  />
                </svg>
                {t("home.startLearning")}
              </span>
              {/* Shimmer overlay */}
              {canStart && (
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
                  }}
                />
              )}
            </button>

            {/* Browse link */}
            <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
              {t("setup.alreadyHaveSession")}{" "}
              <Link
                href="/explore"
                className="font-medium transition-colors"
                style={{ color: "var(--primary-light)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary-light)";
                }}
              >
                {t("home.browsePaths")}
              </Link>
            </p>
          </div>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-in">
            {[
              { icon: "🌍", text: t("home.feature130") },
              { icon: "⚡", text: t("home.pillGroqAI") },
              { icon: "🎓", text: t("home.pillCertificate") },
              { icon: "📊", text: t("home.pillProgress") },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                  color: "var(--muted)",
                }}
              >
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Modals (rendered outside layout flow) */}
      {showLangSelector && (
        <LanguageSelector
          selectedCode={targetLocale}
          onSelect={setTargetLocale}
          onClose={() => setShowLangSelector(false)}
        />
      )}

      {isProcessing && (
        <ProcessingSteps
          currentStep={currentStep}
          error={processingError}
          targetLanguageName={targetLanguageName}
          onDismiss={() => { setIsProcessing(false); setProcessingError(null); }}
        />
      )}
    </>
  );
}

// ---- Sub-components ----

interface ModeButtonProps {
  value: LearningMode;
  current: LearningMode;
  onClick: () => void;
  icon: string;
  label: string;
  description: string;
}

function ModeButton({ value, current, onClick, icon, label, description }: ModeButtonProps) {
  const isSelected = value === current;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-0.5 rounded-lg px-4 py-3 text-left transition-all"
      style={{
        background: isSelected ? "var(--surface)" : "transparent",
        color: "var(--foreground)",
        boxShadow: isSelected ? "0 1px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(108,92,231,0.2)" : "none",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{icon}</span>
        <span
          className="text-lg font-bold"
          style={{ color: isSelected ? "var(--primary)" : "var(--muted)" }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-sm leading-snug mt-1"
        style={{ color: isSelected ? "var(--muted)" : "var(--muted)" }}
      >
        {description}
      </span>
    </button>
  );
}
