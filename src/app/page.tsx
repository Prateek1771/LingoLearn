"use client";

import Link from "next/link";
import { useTranslation } from "@/contexts/UILanguageContext";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto space-y-16 p-4">
      {/* Hero Section */}
      <section className="text-center space-y-8 pt-12 animate-slide-up">
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-8xl pixel-text-strong">
          LingoLearn
        </h1>
        <p className="text-2xl sm:text-3xl font-bold pixel-text" style={{ color: "var(--primary-light)" }}>
          {t("home.tagline")}
        </p>
        <p className="max-w-2xl mx-auto text-xl pixel-text leading-relaxed p-4 glass-panel">
          {t("home.heroDesc")}
        </p>

        <div className="pt-8">
          <Link href="/learn">
            <button className="pixel-border text-white px-10 py-5 text-3xl font-extrabold hover:-translate-y-2 hover:shadow-[0_8px_0px_rgba(0,0,0,0.5)] transition-all bg-[var(--primary)] active:translate-y-0 active:shadow-none">
              {t("home.startLearning")}
            </button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up">
        <div className="glass-panel pixel-border p-8 text-center space-y-4 hover:border-[var(--primary)] transition-colors">
          <div className="text-5xl">🌍</div>
          <h3 className="text-2xl font-bold text-[var(--foreground)]">{t("home.feature130")}</h3>
          <p className="text-[var(--muted)] text-lg">{t("home.featureDesc130")}</p>
        </div>

        <div className="glass-panel pixel-border p-8 text-center space-y-4 hover:border-[var(--primary)] transition-colors">
          <div className="text-5xl">👾</div>
          <h3 className="text-2xl font-bold text-[var(--foreground)]">{t("home.featureCompanions")}</h3>
          <p className="text-[var(--muted)] text-lg">{t("home.featureDescCompanions")}</p>
        </div>

        <div className="glass-panel pixel-border p-8 text-center space-y-4 hover:border-[var(--primary)] transition-colors">
          <div className="text-5xl">🎯</div>
          <h3 className="text-2xl font-bold text-[var(--foreground)]">{t("home.featureFocus")}</h3>
          <p className="text-[var(--muted)] text-lg">{t("home.featureDescFocus")}</p>
        </div>
      </section>

      {/* Project Demo Section */}
      <section className="glass-panel pixel-border p-8 text-center mt-12 animate-slide-up bg-opacity-80">
        <h2 className="text-4xl font-bold pixel-text-strong mb-6">{t("home.projectDemo")}</h2>
        <div className="w-full aspect-video pixel-border overflow-hidden">
          <video
            src="/LingoPromo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onEnded={(e) => { (e.target as HTMLVideoElement).play(); }}
          />
        </div>
      </section>
    </div>
  );
}
