"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/UILanguageContext";

const TUTORIALS = [
  { id: 1, title: "Mastering Basic Spanish Greetings", author: "Alex R.", likes: 1240, category: "Top Ranking" },
  { id: 2, title: "Japanese Hiragana Crash Course", author: "SenseiBot", likes: 890, category: "Suggested" },
  { id: 3, title: "French Pronunciation - The 'R' Sound", author: "Marie L.", likes: 530, category: "Other Tutorials" },
  { id: 4, title: "Intermediate German Grammar", author: "Hans", likes: 210, category: "Suggested" },
  { id: 5, title: "Korean Alphabet (Hangul) in 30 Mins", author: "SeoulMate", likes: 1560, category: "Top Ranking" },
  { id: 6, title: "Italian for Travel: Ordering Food", author: "Giulia", likes: 450, category: "Other Tutorials" },
];

const VOTES_KEY = "lingodev_communityVotes";

function loadVotes(): Record<number, boolean> {
  try {
    const stored = localStorage.getItem(VOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveVotes(votes: Record<number, boolean>): void {
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  } catch {
    // ignore storage errors
  }
}

export default function CommunityPage() {
  const { t } = useTranslation();
  const sections = [
    { key: "topRanking", label: t("community.topRanking"), value: "Top Ranking" },
    { key: "suggested", label: t("community.suggested"), value: "Suggested" },
    { key: "otherTutorials", label: t("community.otherTutorials"), value: "Other Tutorials" },
  ];
  const [votes, setVotes] = useState<Record<number, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    const stored = loadVotes();
    setVotes(stored);
    const counts: Record<number, number> = {};
    for (const t of TUTORIALS) {
      counts[t.id] = t.likes + (stored[t.id] ? 1 : 0);
    }
    setLikeCounts(counts);
  }, []);

  function handleUpvote(postId: number) {
    if (votes[postId]) return;
    const newVotes = { ...votes, [postId]: true };
    setVotes(newVotes);
    saveVotes(newVotes);
    setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-4 pt-10">
      <header className="text-center space-y-4 animate-slide-up">
        <h1 className="text-5xl font-extrabold pixel-text-strong">{t("community.title")}</h1>
        <p className="text-xl" style={{ color: "var(--foreground)", opacity: 0.7 }}>
          {t("community.subtitle")}
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.key} className="space-y-6 animate-slide-up">
          <h2 className="text-3xl font-bold pixel-text border-b-4 border-[var(--primary)] pb-2 inline-block">
            {section.label}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {TUTORIALS.filter((tutorial) => tutorial.category === section.value).map((tutorial) => {
              const voted = votes[tutorial.id] ?? false;
              const count = likeCounts[tutorial.id] ?? tutorial.likes;
              return (
                <div key={tutorial.id} className="glass-panel pixel-border p-6">
                  <div className="w-full h-32 bg-[var(--surface-light)] pixel-border mb-4 flex items-center justify-center">
                    <span className="text-4xl">▶️</span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 truncate" title={tutorial.title}>
                    {tutorial.title}
                  </h3>
                  <div className="flex justify-between items-center text-lg">
                    <span style={{ color: "var(--foreground)", opacity: 0.7 }}>👤 {tutorial.author}</span>
                    <button
                      type="button"
                      onClick={() => handleUpvote(tutorial.id)}
                      disabled={voted}
                      className={`flex items-center gap-1 font-bold transition-transform ${
                        voted
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:scale-110 hover:text-[var(--primary-text)]"
                      }`}
                      style={{ color: "var(--primary-text)" }}
                      title={voted ? t("community.alreadyVoted") : t("community.upvote")}
                    >
                      {voted ? "⭐" : "☆"} {count}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
