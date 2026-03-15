"use client";

import { useState, useEffect, useRef } from "react";
import { LANGUAGE_REGIONS, searchLanguages, getAllLanguages } from "@/lib/languages";
import type { Language } from "@/lib/languages";
import { useTranslation } from "@/contexts/UILanguageContext";

interface LanguageSelectorProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export default function LanguageSelector({
  selectedCode,
  onSelect,
  onClose,
}: LanguageSelectorProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isSearching = query.trim().length > 0;
  const searchResults = isSearching ? searchLanguages(query) : [];
  const totalCount = getAllLanguages().length;

  function handleSelect(code: string) {
    onSelect(code);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 15, 19, 0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-lg rounded-2xl border flex flex-col"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          maxHeight: "80vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                {t("langSelector.title")}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                {t("langSelector.poweredBy", { count: totalCount })}{" "}
                <span style={{ color: "var(--accent)" }} className="font-medium">
                  Lingo.dev
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-light)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: "var(--muted)" }}
            >
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("langDropdown.searchPlaceholder")}
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
              style={{
                background: "var(--surface-light)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(108, 92, 231, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Language list */}
        <div className="overflow-y-auto flex-1 p-2">
          {isSearching ? (
            searchResults.length > 0 ? (
              <div>
                <p
                  className="px-3 py-2 text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  {t("langSelector.results", { count: searchResults.length })}
                </p>
                {searchResults.map((lang) => (
                  <LanguageRow
                    key={lang.code}
                    lang={lang}
                    selected={lang.code === selectedCode}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center" style={{ color: "var(--muted)" }}>
                <p className="text-sm">{t("langSelector.noResults", { query })}</p>
              </div>
            )
          ) : (
            Object.entries(LANGUAGE_REGIONS).map(([region, langs]) => (
              <div key={region} className="mb-2">
                <p
                  className="px-3 py-2 text-xs font-medium uppercase tracking-wider sticky top-0"
                  style={{
                    color: "var(--muted)",
                    background: "var(--surface)",
                  }}
                >
                  {region}
                </p>
                {langs.map((lang) => (
                  <LanguageRow
                    key={lang.code}
                    lang={lang}
                    selected={lang.code === selectedCode}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LanguageRow({
  lang,
  selected,
  onSelect,
}: {
  lang: Language;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(lang.code)}
      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all text-left"
      style={{
        background: selected ? "rgba(108, 92, 231, 0.15)" : "transparent",
        border: selected ? "1px solid rgba(108, 92, 231, 0.3)" : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-light)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span
            className="text-sm font-medium"
            style={{ color: selected ? "var(--primary-light)" : "var(--foreground)" }}
          >
            {lang.name}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {lang.nativeName}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-xs font-mono"
          style={{
            background: "var(--surface-light)",
            color: "var(--muted)",
          }}
        >
          {lang.code}
        </span>
        {selected && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--primary)" }}>
            <path
              d="M2.5 7L5.5 10L11.5 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
