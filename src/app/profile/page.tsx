"use client";

import React, { useState } from "react";
import { useTranslation } from "@/contexts/UILanguageContext";

export default function ProfilePage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("Alex Rivera");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("Alex Rivera");

  function saveUsername() {
    setUsername(editValue);
    setIsEditing(false);
  }

  const stats = [
    { icon: "⭐", value: "850", label: t("profile.overallScore") },
    { icon: "📹", value: "24", label: t("profile.videosMastered") },
    { icon: "📚", value: "3", label: t("profile.published") },
  ];

  const history = [
    { id: "1", title: "Spanish Greetings 101" },
    { id: "2", title: "Italian Food Vocabulary" },
    { id: "3", title: "Japanese Hiragana Basics" },
  ];

  const published = [
    { id: "1", title: "My Custom English Grammar Lesson", likes: 120 },
    { id: "2", title: "French Numbers for Travelers", likes: 45 },
    { id: "3", title: "Mandarin Tones Explained", likes: 78 },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 animate-slide-up">
      {/* Identity Card */}
      <div className="glass-panel pixel-border p-6 text-center">
        <div className="w-24 h-24 mx-auto bg-[var(--surface-light)] pixel-border flex items-center justify-center mb-4">
          <span className="text-5xl">👤</span>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveUsername()}
              className="w-full pixel-border p-2 bg-[var(--surface)] text-[var(--foreground)] text-center text-xl"
              autoFocus
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={saveUsername}
                className="pixel-border bg-[var(--primary)] text-white px-4 py-2 hover:opacity-90 transition-opacity"
              >
                {t("profile.save")}
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditValue(username); }}
                className="pixel-border bg-[var(--surface-light)] text-[var(--foreground)] px-4 py-2 hover:opacity-90 transition-opacity"
              >
                {t("myLearnings.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold pixel-text">{username}</h2>
            <button
              onClick={() => { setIsEditing(true); setEditValue(username); }}
              title={t("profile.editUsername")}
              className="text-lg hover:text-[var(--primary-text)] transition-colors"
            >
              ✏️
            </button>
          </div>
        )}

        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t("profile.noviceLinguist")} · {t("profile.level", { level: 12 })}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="glass-panel pixel-border p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-extrabold pixel-text-strong">{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Learning History */}
      <div className="glass-panel pixel-border p-6">
        <h2 className="text-2xl font-bold pixel-text mb-4">{t("profile.learningHistory")}</h2>
        <ul className="space-y-2">
          {history.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center p-3 bg-[var(--surface-light)] pixel-border"
            >
              <span className="text-[var(--foreground)]">{item.title}</span>
              <span className="text-sm font-bold" style={{ color: "var(--success-text)" }}>
                {t("profile.completed")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Published */}
      <div className="glass-panel pixel-border p-6">
        <h2 className="text-2xl font-bold pixel-text mb-4">{t("profile.publishedByYou")}</h2>
        <ul className="space-y-2">
          {published.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center p-3 bg-[var(--surface-light)] pixel-border cursor-pointer hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              <span>{item.title}</span>
              <span className="text-sm font-bold">⭐ {item.likes} {t("profile.likes")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
