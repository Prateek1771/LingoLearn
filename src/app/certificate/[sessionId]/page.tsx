"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getLanguageName } from "@/lib/languages";
import { getCompanion } from "@/lib/companions";
import type { Session } from "@/lib/types";
import { useTranslation } from "@/contexts/UILanguageContext";

// ---- Date formatter ----

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---- Certificate Design Component ----

interface CertificateProps {
  session: Session;
}

const CertificateDisplay = ({ session }: CertificateProps) => {
  const { t } = useTranslation();
  const labels = session.translatedContent.certificateLabels;
  const companion = session.companionId ? getCompanion(session.companionId) : null;
  const languageName = getLanguageName(session.targetLocale);
  const completionDate = formatDate(session.completedAt ?? session.createdAt);

  return (
    <div 
      id="certificate-content"
      className="relative w-full max-w-[900px] overflow-hidden glass-panel pixel-border p-2 bg-[#12122a] shadow-2xl"
    >
      {/* Decorative Outer Border Wrap */}
      <div className="relative border-4 border-double border-[var(--primary)] p-8 sm:p-12 flex flex-col items-center text-center overflow-hidden">
        
        {/* Floating Companion - Fixed layout */}
        {companion && (
          <div className="absolute left-4 top-4 w-32 h-32 pointer-events-none z-0 opacity-20 sm:opacity-100 sm:w-40 sm:h-40">
            <img 
              src={companion.idleGif} 
              alt={companion.name} 
              className="w-full h-full object-contain filter drop-shadow-2xl animate-pulse"
            />
          </div>
        )}

        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[var(--accent)] z-10" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[var(--accent)] z-10" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[var(--accent)] z-10" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[var(--accent)] z-10" />

        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Top Emblem / Header */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="text-5xl drop-shadow-md animate-bounce">🏆</div>
            <div className="flex items-center gap-4">
              <div className="h-0.5 w-12 bg-[var(--primary)] opacity-50" />
              <span className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--primary-text)] pixel-text">
                {t("certificate.protocol")}
              </span>
              <div className="h-0.5 w-12 bg-[var(--primary)] opacity-50" />
            </div>
          </div>

          {/* Certificate title */}
          <div className="mb-4">
            <h1 className="text-4xl font-black uppercase tracking-widest sm:text-6xl text-[var(--foreground)] pixel-text-strong">
              {labels.title}
            </h1>
            <div className="h-1 w-24 bg-[var(--accent)] mx-auto mt-2 opacity-80" />
          </div>

          <p className="mb-8 text-xl font-bold uppercase tracking-[0.2em] text-[var(--muted)] pixel-text opacity-80">
            {labels.awardedTo}
          </p>

          {/* User name Section */}
          <div className="mb-10 relative">
            <p className="text-5xl sm:text-7xl font-black tracking-tight text-[var(--accent-text)] pixel-text-strong px-4 text-center">
              {session.userName}
            </p>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-[var(--accent)] opacity-30 blur-[1px]" />
          </div>

          {/* For completing label + video title */}
          <div className="mb-10 space-y-3">
            <p className="text-lg font-bold uppercase tracking-widest text-[var(--muted)] pixel-text">
              {labels.forCompleting}
            </p>
            <div className="relative inline-block px-8 py-4 glass-panel bg-black/5 pixel-border max-w-lg">
              <p className="text-2xl font-bold leading-tight text-[var(--foreground)] pixel-text-strong italic">
                &ldquo;{session.metadata.title}&rdquo;
              </p>
            </div>
          </div>

          {/* Meta info grid - Badges */}
          <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="flex flex-col items-center p-4 bg-[var(--surface)] pixel-border shadow-sm">
              <p className="text-xs font-bold uppercase text-[var(--primary-text)] pixel-text mb-1">
                {labels.completionDate}
              </p>
              <p className="text-lg font-bold text-[var(--foreground)] pixel-text-strong">
                {completionDate}
              </p>
            </div>
            <div className="flex flex-col items-center p-4 bg-[var(--surface)] pixel-border shadow-sm border-t-4 border-t-[var(--accent)]">
              <p className="text-xs font-bold uppercase text-[var(--primary-text)] pixel-text mb-1">
                {labels.language}
              </p>
              <p className="text-lg font-bold text-[var(--foreground)] pixel-text-strong">
                {languageName}
              </p>
            </div>
            <div className="flex flex-col items-center p-4 bg-[var(--surface)] pixel-border shadow-sm">
              <p className="text-xs font-bold uppercase text-[var(--primary-text)] pixel-text mb-1">
                {t("certificate.mode")}
              </p>
              <p className="text-lg font-bold text-[var(--foreground)] capitalize pixel-text-strong">
                {session.mode}
              </p>
            </div>
          </div>

          {/* Footer Seal */}
          <div className="flex items-center justify-between w-full mt-4 pt-8 border-t-2 border-dashed border-[var(--border)]">
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("certificate.verificationId")}</p>
              <p className="text-xs font-mono text-[var(--primary-text)]">{session.id.slice(0, 8).toUpperCase()}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-2xl opacity-80">🛡️</div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] pixel-text mt-1">
                {labels.poweredBy}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("certificate.status")}</p>
              <p className="text-xs font-bold text-[var(--success-text)] uppercase tracking-tighter">{t("certificate.verifiedLead")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Action Buttons ----

interface ActionBarProps {
  session: Session;
}

function ActionBar({ session }: ActionBarProps) {
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const { t } = useTranslation();

  async function handleDownloadPDF() {
    const content = document.getElementById("certificate-content");
    if (!content) return;
    setDownloading(true);
    setDownloadError(false);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      // Set explicit dimensions for capture to avoid responsive layout shifts
      const originalWidth = content.offsetWidth;
      const originalHeight = content.offsetHeight;

      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#12122a",
        width: originalWidth,
        height: originalHeight,
        windowWidth: 1200, // Force a desktop-like width for cleaner layout in PDF
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [originalWidth, originalHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, originalWidth, originalHeight);
      pdf.save(`LingoDev_Certificate_${session.userName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      {/* Download PDF */}
      <button
        type="button"
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="flex flex-row items-center gap-2 px-6 py-3 text-xl font-bold transition-transform hover:scale-105 glass-panel pixel-border bg-[var(--accent)] text-[var(--foreground)] hover:brightness-110"
        style={{
          opacity: downloading ? 0.7 : 1,
          cursor: downloading ? "not-allowed" : "pointer",
        }}
      >
        {downloading ? t("certificate.downloading") : t("certificate.downloadPDF")}
      </button>
      {downloadError && (
        <p className="text-xs mt-2 text-center" style={{ color: "var(--error)" }}>
          Download failed. Try again or use your browser&apos;s print function.
        </p>
      )}

      {/* Share */}
      <button
        type="button"
        onClick={handleShare}
        className="flex flex-row items-center gap-2 px-6 py-3 text-xl font-bold transition-transform hover:scale-105 glass-panel pixel-border bg-[var(--primary)] text-white hover:bg-[var(--primary-text)]"
      >
        {copying ? t("certificate.linkCopied") : t("certificate.share")}
      </button>
    </div>
  );
}

// ---- Incomplete state ----

function IncompletePage({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center bg-[var(--error)] text-white text-5xl font-bold pixel-border">
        !
      </div>
      <h1 className="mb-4 text-4xl font-extrabold text-[var(--foreground)] pixel-text-strong">
        {t("certificate.notReady")}
      </h1>
      <p className="mb-8 max-w-sm text-lg leading-relaxed text-[var(--muted)] pixel-text">
        {t("certificate.notReadyDesc")}
      </p>
      <Link
        href={`/learn/${sessionId}`}
        className="flex items-center gap-2 px-6 py-4 text-xl font-bold transition-transform hover:scale-105 glass-panel pixel-border bg-[var(--primary)] text-white hover:bg-[var(--primary-light)]"
      >
        {t("certificate.continueLearning")}
      </Link>
    </div>
  );
}

// ---- Not found state ----

function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-extrabold text-[var(--foreground)] pixel-text-strong">
        {t("certificate.sessionNotFound")}
      </h1>
      <p className="mb-8 text-lg text-[var(--muted)] pixel-text">
        {t("certificate.sessionNotFoundDesc")}
      </p>
      <Link href="/my-learnings" className="text-xl font-bold text-[var(--primary-text)] hover:underline pixel-text">
        {t("certificate.backToMyLearnings")}
      </Link>
    </div>
  );
}

// ---- Main Page ----

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function CertificatePage({ params }: PageProps) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const { t } = useTranslation();

  useEffect(() => {
    const s = getSession(sessionId);
    setSession(s);
  }, [sessionId]);

  // Loading
  if (session === undefined) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="flex items-center gap-3" style={{ color: "var(--muted)" }}>
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="var(--border)" strokeWidth="2.5" />
            <path d="M10 2a8 8 0 018 8" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-sm">{t("certificate.loading")}</span>
        </div>
      </div>
    );
  }

  // Not found
  if (!session) return <NotFoundPage />;

  // Check completion — requires final quiz to be passed
  const isComplete = session.progress.finalQuizPassed === true;

  if (!isComplete) return <IncompletePage sessionId={sessionId} />;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-24 sm:px-6">
        {/* Header */}
        <div className="mb-10 animate-fade-in text-center flex flex-col items-center">
          <Link
            href="/my-learnings"
            className="mb-8 inline-flex items-center gap-2 text-lg font-bold transition-transform hover:scale-105 glass-panel pixel-border px-4 py-2 hover:bg-[var(--primary)] hover:text-white text-[var(--foreground)]"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
            </svg>
            {t("certificate.backToMyLearnings")}
          </Link>

          <div>
            <div className="mb-4 inline-flex items-center px-4 py-2 text-lg font-bold bg-[var(--success)] text-white pixel-border animate-pulse shadow-md">
              {t("certificate.courseCompleted")}
            </div>

            <h1 className="text-4xl font-extrabold sm:text-5xl pixel-text-strong tracking-wide text-[var(--foreground)]">
              {t("certificate.title")}
            </h1>
            <p className="mt-4 text-xl pixel-text text-[var(--muted)] font-medium">
              {t("certificate.congratulations", { name: session.userName })}
            </p>
          </div>
        </div>

        {/* The Certificate */}
        <div className="animate-slide-up flex justify-center w-full">
          <CertificateDisplay session={session} />
        </div>

        {/* Action buttons */}
        <ActionBar session={session} />

        {/* Footer note */}
        <p className="mt-12 text-center text-lg text-[var(--muted)] pixel-text border-t-4 border-dashed border-[var(--border)] pt-8">
          {t("certificate.shareOrDownload")}
        </p>
      </main>
    </div>
  );
}
