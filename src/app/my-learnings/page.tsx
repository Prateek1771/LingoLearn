"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/UILanguageContext";
import type { Session } from "@/lib/types";

export default function MyLearningsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ongoing" | "completed">("ongoing");

  useEffect(() => {
    loadSessions();
  }, []);

  function loadSessions() {
    const saved = localStorage.getItem("lingodev_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    setLoading(false);
  }

  function deleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id);
    localStorage.setItem("lingodev_sessions", JSON.stringify(updated));
    setSessions(updated);
  }

  const ongoing = sessions.filter((s) => s.status !== "completed");
  const completed = sessions.filter((s) => s.status === "completed");

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in relative z-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black pixel-text-strong text-[var(--foreground)] mb-2">
          {t("myLearnings.title")}
        </h1>
        <p className="text-sm pixel-text text-[var(--foreground)] opacity-80">
          {t("myLearnings.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 justify-center">
        <button
          onClick={() => setActiveTab("ongoing")}
          className={`px-6 py-2 font-bold pixel-border transition-all ${
            activeTab === "ongoing"
              ? "bg-[var(--primary)] text-white translate-y-[-2px] shadow-[0_4px_0_var(--primary-dark)]"
              : "glass-panel text-[var(--foreground)] hover:bg-[var(--surface-light)]"
          }`}
        >
          {t("myLearnings.tabOngoing")} ({ongoing.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-6 py-2 font-bold pixel-border transition-all ${
            activeTab === "completed"
              ? "bg-[var(--success)] text-white translate-y-[-2px] shadow-[0_4px_0_var(--success-dark)]"
              : "glass-panel text-[var(--foreground)] hover:bg-[var(--surface-light)]"
          }`}
        >
          {t("myLearnings.tabCompleted")} ({completed.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">{t("common.loading")}</div>
      ) : activeTab === "ongoing" ? (
        ongoing.length === 0 ? (
          <EmptyState
            title={t("myLearnings.noOngoing")}
            description={t("myLearnings.noOngoingDesc")}
            onAction={() => router.push("/learn")}
            actionLabel={t("myLearnings.startLearning")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ongoing.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onDelete={() => deleteSession(s.id)}
                onAction={() => router.push(`/learn/${s.id}`)}
                actionLabel={t("myLearnings.continue")}
              />
            ))}
          </div>
        )
      ) : completed.length === 0 ? (
        <EmptyState
          title={t("myLearnings.noCompleted")}
          description={t("myLearnings.noCompletedDesc")}
          onAction={() => router.push("/explore")}
          actionLabel={t("explore.title")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completed.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onDelete={() => deleteSession(s.id)}
              onAction={() => router.push(`/certificate/${s.id}`)}
              actionLabel={t("myLearnings.viewCertificate")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  onDelete,
  onAction,
  actionLabel,
}: {
  session: Session;
  onDelete: () => void;
  onAction: () => void;
  actionLabel: string;
}) {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);

  const cleared = session.progress.breakpointsCleared.filter(Boolean).length;
  const total = session.progress.breakpointsCleared.length;

  return (
    <div className="glass-panel pixel-border p-4 flex flex-col group animate-slide-up relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--primary)] opacity-[0.03] rounded-bl-full pointer-events-none group-hover:opacity-[0.06] transition-opacity" />

      {/* Hero Icon */}
      <div className="relative h-40 bg-[var(--surface)] pixel-border mb-4 overflow-hidden group">
        <img
          src={session.metadata.thumbnail}
          alt={session.metadata.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <span className="text-xl ml-1">▶️</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 pixel-border font-bold uppercase tracking-wider">
            {session.targetLocale}
          </span>
          {session.status === "completed" ? (
            <span className="bg-[var(--success)] text-white text-[10px] px-2 py-0.5 pixel-border font-bold uppercase">
              {t("myLearnings.statusCompleted")}
            </span>
          ) : (
            <span className="bg-[var(--warning)] text-white text-[10px] px-2 py-0.5 pixel-border font-bold uppercase">
              {t("myLearnings.statusOngoing")}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <h3 className="font-bold text-lg line-clamp-2 pixel-text text-[var(--foreground)] leading-tight">
          {session.metadata.title}
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-[var(--muted)] uppercase tracking-tighter">
            <span>{t("myLearnings.checkpoints", { cleared, total })}</span>
            <span>{Math.round((cleared / (total || 1)) * 100)}%</span>
          </div>
          <div className="h-2 bg-[var(--surface-light)] pixel-border overflow-hidden p-[1px]">
            <div
              className={`h-full transition-all duration-500 ${
                session.status === "completed" ? "bg-[var(--success)]" : "bg-[var(--primary)]"
              }`}
              style={{ width: `${(cleared / (total || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            onClick={onAction}
            className={`flex-1 py-2 font-bold pixel-border transition-all active:translate-y-[1px] ${
              session.status === "completed"
                ? "bg-[var(--success)] text-white hover:bg-[var(--success-dark)]"
                : "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
            }`}
          >
            {actionLabel}
          </button>

          {showConfirm ? (
            <div className="flex gap-1 animate-in slide-in-from-right-2 duration-200">
              <button
                onClick={onDelete}
                className="bg-[var(--error)] text-white px-3 py-2 text-xs font-bold pixel-border"
              >
                {t("myLearnings.delete")}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-[var(--surface-light)] text-[var(--foreground)] px-2 py-2 text-xs font-bold pixel-border"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-[var(--surface-light)] text-[var(--foreground)] px-3 py-2 text-xs font-bold pixel-border hover:bg-[var(--error)] hover:text-white transition-colors"
              title={t("myLearnings.delete")}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  onAction,
  actionLabel,
}: {
  title: string;
  description: string;
  onAction: () => void;
  actionLabel: string;
}) {
  return (
    <div className="glass-panel pixel-border p-12 text-center max-w-lg mx-auto animate-slide-up">
      <div className="text-6xl mb-6">🏜️</div>
      <h2 className="text-2xl font-black pixel-text-strong text-[var(--foreground)] mb-2">
        {title}
      </h2>
      <p className="text-[var(--muted)] mb-8 pixel-text">{description}</p>
      <button
        onClick={onAction}
        className="px-8 py-3 bg-[var(--primary)] text-white font-bold pixel-border hover:scale-105 transition-transform"
      >
        {actionLabel}
      </button>
    </div>
  );
}
