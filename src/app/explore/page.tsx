"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EXPLORE_ENTRIES, CATEGORIES, type ExploreEntry } from "@/data/explore-data";
import { useTranslation } from "@/contexts/UILanguageContext";

// ---- Category key mapping ----
const CATEGORY_KEYS: Record<string, string> = {
  "All": "explore.categoryAll",
  "Coding": "explore.categoryCoding",
  "Cooking": "explore.categoryCooking",
  "Music": "explore.categoryMusic",
  "Science": "explore.categoryScience",
  "Kids": "explore.categoryKids",
  "Fitness": "explore.categoryFitness",
  "Art": "explore.categoryArt",
  "Language Learning": "explore.categoryLanguage",
};

// ---- Star Rating Display ----

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const partial = rating - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f-${i}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6 8l-2.78 1.55.53-3.1L1.5 4.25l3.1-.45L6 1z"
            fill="#fdcb6e"
          />
        </svg>
      ))}
      {partial > 0 && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <defs>
            <linearGradient id="partial-star" x1="0" x2="1" y1="0" y2="0">
              <stop offset={`${partial * 100}%`} stopColor="#fdcb6e" />
              <stop offset={`${partial * 100}%`} stopColor="var(--border)" />
            </linearGradient>
          </defs>
          <path
            d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6 8l-2.78 1.55.53-3.1L1.5 4.25l3.1-.45L6 1z"
            fill="url(#partial-star)"
          />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e-${i}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6 8l-2.78 1.55.53-3.1L1.5 4.25l3.1-.45L6 1z"
            fill="var(--border)"
          />
        </svg>
      ))}
      <span className="ml-1 text-xs font-medium" style={{ color: "var(--warning-text)" }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ---- Category colour map ----

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Coding: { bg: "rgba(108, 92, 231, 0.18)", text: "var(--primary-light)" },
  Cooking: { bg: "rgba(0, 184, 148, 0.15)", text: "var(--success-text)" },
  Music: { bg: "rgba(253, 203, 110, 0.15)", text: "var(--warning-text)" },
  Science: { bg: "rgba(0, 206, 201, 0.15)", text: "var(--accent-text)" },
  Kids: { bg: "rgba(225, 112, 85, 0.15)", text: "var(--error)" },
  Fitness: { bg: "rgba(0, 184, 148, 0.12)", text: "var(--accent-text)" },
  Art: { bg: "rgba(162, 155, 254, 0.15)", text: "var(--primary-light)" },
  "Language Learning": { bg: "rgba(0, 206, 201, 0.12)", text: "var(--accent-text)" },
  default: { bg: "rgba(108, 92, 231, 0.1)", text: "var(--muted)" },
};

function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation();
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
  const translationKey = CATEGORY_KEYS[category] || "explore.filterAll";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: colors.bg, color: colors.text }}
    >
      {t(translationKey as any)}
    </span>
  );
}

// ---- Thumbnail with fallback ----

function ThumbnailImg({ src, alt, title }: { src: string; alt: string; title: string }) {
  const [broken, setBroken] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth <= 120) setBroken(true);
  }, []);

  if (broken) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-light))" }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="2" y="6" width="28" height="20" rx="2" stroke="var(--muted)" strokeWidth="1.5" />
          <path d="M13 11.5l8 4.5-8 4.5V11.5z" fill="var(--muted)" />
        </svg>
        <span className="text-xs font-medium px-3 text-center line-clamp-2" style={{ color: "var(--muted)" }}>
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      onLoad={(e) => { if (e.currentTarget.naturalWidth <= 120) setBroken(true); }}
      onError={() => setBroken(true)}
    />
  );
}

// ---- Community Card (standard) ----

function CommunityCard({ entry, onClick }: { entry: ExploreEntry; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden text-left transition-transform hover:scale-105 glass-panel pixel-border p-2"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <ThumbnailImg src={entry.thumbnail} alt={entry.title} title={entry.title} />
        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: "rgba(108, 92, 231, 0.35)" }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.95)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 2.5L11.5 7 4 11.5V2.5z" fill="#6c5ce7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3 bg-black/20 mt-2 border-2 border-[var(--border)]">
        <p
          className="line-clamp-2 text-sm font-semibold leading-snug pixel-text"
          style={{ color: "var(--foreground)" }}
        >
          {entry.title}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <CategoryBadge category={entry.category} />
          <StarRating rating={entry.rating} />
        </div>
      </div>
    </button>
  );
}

// ---- Recommended Card (larger/highlighted) ----

function RecommendedCard({ entry, onClick }: { entry: ExploreEntry; onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden text-left transition-transform hover:scale-105 glass-panel p-3 border-4 border-[var(--warning)]"
      style={{ boxShadow: "4px 4px 0px rgba(0,0,0,0.4)" }}
    >
      {/* Blocky top accent */}
      <div
        className="absolute inset-x-0 top-0 h-2 bg-[var(--warning)] pointer-events-none"
      />

      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <img
          src={entry.thumbnail}
          alt={entry.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth <= 120) {
              img.style.display = "none";
              const fallback = img.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }
          }}
          onError={(e) => {
            const img = e.currentTarget;
            img.style.display = "none";
            const fallback = img.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        {/* Fallback placeholder shown when thumbnail is unavailable */}
        <div
          className="absolute inset-0 items-center justify-center flex-col gap-2 hidden"
          style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-light))" }}
        >
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="6" width="28" height="20" rx="2" stroke="var(--muted)" strokeWidth="1.5" />
            <path d="M13 11.5l8 4.5-8 4.5V11.5z" fill="var(--muted)" />
          </svg>
          <span className="text-xs font-medium px-4 text-center" style={{ color: "var(--muted)" }}>
            {entry.title}
          </span>
        </div>

        {/* Recommended badge */}
        <div className="absolute left-3 top-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              color: "white",
              boxShadow: "0 2px 12px rgba(108, 92, 231, 0.4)",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M5 1l1.1 2.2 2.4.35-1.75 1.7.41 2.4L5 6.5l-2.16 1.15.41-2.4L1.5 3.55l2.4-.35L5 1z"
                fill="white"
              />
            </svg>
            {t("explore.adminPick")}
          </span>
        </div>

        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: "rgba(108, 92, 231, 0.4)" }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 4px 24px rgba(108, 92, 231, 0.5)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 3.5L14.5 9 5 14.5V3.5z" fill="#6c5ce7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4 bg-black/20 mt-3 border-2 border-[var(--border)]">
        <p
          className="line-clamp-2 text-lg font-bold leading-snug pixel-text-strong"
          style={{ color: "var(--foreground)" }}
        >
          {entry.title}
        </p>
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={entry.category} />
          <StarRating rating={entry.rating} />
        </div>
        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--primary-light)" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM5.25 4v3.19l2.44 1.44.56-.94-2-1.19V4H5.25z"
              fill="currentColor"
            />
          </svg>
          {t("explore.clickToLearn")}
        </div>
      </div>
    </button>
  );
}

// ---- Main Page ----

export default function ExplorePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("All");

  const recommended = EXPLORE_ENTRIES.filter((e) => e.isRecommended);
  const community = EXPLORE_ENTRIES.filter((e) => {
    if (e.isRecommended) return false;
    if (activeCategory === "All") return true;
    return e.category === activeCategory;
  });

  function handleCardClick(entry: ExploreEntry) {
    router.push(`/learn?url=${encodeURIComponent(entry.youtubeUrl)}`);
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
    >
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary-light)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("common.backToHome")}
          </Link>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold sm:text-5xl pixel-text-strong text-[var(--foreground)] tracking-wide">
                {t("explore.title")}
              </h1>
              <p className="mt-2 text-lg pixel-text" style={{ color: "var(--foreground)" }}>
                {t("explore.subtitle")}
              </p>
            </div>

            <Link
              href="/my-learnings"
              className="hidden shrink-0 items-center gap-2 px-4 py-2 text-lg font-bold transition-transform hover:scale-105 sm:flex glass-panel pixel-border text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect
                  x="2"
                  y="2"
                  width="11"
                  height="11"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M5 7.5h5M5 5h3M5 10h4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </svg>
              {t("nav.myLearnings")}
            </Link>
          </div>
        </div>

        {/* Admin Recommended Section */}
        <section className="mb-14 animate-slide-up">
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1.5l1.4 2.8 3.1.45-2.25 2.2.53 3.1L7 8.5l-2.78 1.55.53-3.1-2.25-2.2 3.1-.45L7 1.5z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                {t("explore.adminRecommended")}
              </h2>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("explore.handPicked")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((entry) => (
              <RecommendedCard
                key={entry.id}
                entry={entry}
                onClick={() => handleCardClick(entry)}
              />
            ))}
          </div>
        </section>

        {/* Community Gallery */}
        <section className="animate-fade-in">
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--surface-light)", border: "1.5px solid var(--border)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="5" cy="5" r="2" stroke="var(--muted)" strokeWidth="1.3" />
                <circle cx="9" cy="5" r="2" stroke="var(--muted)" strokeWidth="1.3" />
                <path
                  d="M1 12c0-2.21 1.79-4 4-4h4c2.21 0 4 1.79 4 4"
                  stroke="var(--muted)"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                {t("explore.communityGallery")}
              </h2>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("explore.browseTopics")}
              </p>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-4 py-2 text-lg font-bold transition-transform hover:scale-105 pixel-border ${
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : "glass-panel text-[var(--foreground)] hover:bg-[var(--surface-light)]"
                  }`}
                >
                  {t((CATEGORY_KEYS[cat] || "explore.categoryAll") as any)}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {community.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-2xl py-16"
              style={{ background: "var(--surface)", border: "1.5px solid var(--border)" }}
            >
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "var(--surface-light)" }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="var(--muted)" strokeWidth="1.5" />
                  <path
                    d="M8 13s1.2 2 3 2 3-2 3-2M8.5 8.5h.01M13.5 8.5h.01"
                    stroke="var(--muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="font-medium" style={{ color: "var(--muted)" }}>
                {t("explore.noVideos")}
              </p>
              <button
                type="button"
                onClick={() => setActiveCategory("All")}
                className="mt-3 text-sm font-medium transition-colors"
                style={{ color: "var(--primary-light)" }}
              >
                {t("explore.viewAllCategories")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {community.map((entry) => (
                <CommunityCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => handleCardClick(entry)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
