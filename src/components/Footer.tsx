"use client";

import React, { useState } from "react";
import { useTranslation } from "@/contexts/UILanguageContext";

const Footer = () => {
  const { t } = useTranslation();
  const [showCredits, setShowCredits] = useState(false);

  return (
    <footer className="relative mt-20 pb-10 px-4 z-10">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
        {/* Built By Section */}
        <div className="glass-panel pixel-border px-8 py-4 text-center transform hover:scale-105 transition-transform">
          <p className="text-lg font-bold pixel-text text-[var(--foreground)]">
            {t("footer.builtBy")}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            {t("footer.poweredBy")}
          </p>
        </div>

        {/* Credits Button */}
        <button
          onClick={() => setShowCredits(!showCredits)}
          className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[var(--primary-light)] transition-all pixel-text"
        >
          {t("footer.credits")}
        </button>

        {/* Expandable Credits Panel */}
        {showCredits && (
          <div className="glass-panel pixel-border p-8 animate-slide-up w-full max-w-2xl bg-[var(--surface)]">
            <h4 className="text-xl font-black mb-6 text-center tracking-tighter text-[var(--foreground)] pixel-text-strong">
              {t("footer.specialThanks")}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CreditItem
                title="Lingo.dev"
                desc={t("footer.magic")}
                icon="🪄"
              />
              <CreditItem
                title="YouTube"
                desc={t("footer.library")}
                icon="📺"
              />
              <CreditItem
                title="Groq"
                desc={t("footer.inference")}
                icon="⚡"
              />
              <CreditItem
                title="DeepMind"
                desc={t("footer.vibes")}
                icon="🧞"
              />
              <CreditItem
                title={t("footer.designs")}
                desc={t("footer.collaborators")}
                icon="⚔️"
              />
              <CreditItem
                title="Vercel"
                desc={t("footer.delivery")}
                icon="🔼"
              />
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border)] text-center italic text-sm text-[var(--muted)] pixel-text">
              {t("footer.madeWithLove")}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

const CreditItem = ({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) => (
  <div className="flex items-start gap-3 p-3 bg-[var(--surface-light)] pixel-border hover:bg-[var(--primary)] group transition-colors">
    <span className="text-xl">{icon}</span>
    <div>
      <h5 className="font-bold text-sm text-[var(--foreground)] group-hover:text-white transition-colors">
        {title}
      </h5>
      <p className="text-[10px] leading-tight opacity-70 text-[var(--foreground)] group-hover:text-white transition-colors">
        {desc}
      </p>
    </div>
  </div>
);

export default Footer;
