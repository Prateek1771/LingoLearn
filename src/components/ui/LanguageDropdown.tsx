"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/contexts/UILanguageContext";
import { LANGUAGE_REGIONS, searchLanguages, type Language } from "@/lib/languages";
import { BUNDLED_LOCALES } from "@/lib/ui-translation-bundles";

export default function LanguageDropdown() {
  const { language, isLoading, setLanguage, t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) setTimeout(() => inputRef.current?.focus(), 0);
  }, [isEditing]);

  const results = query.trim() ? searchLanguages(query) : null;
  const currentCode = language.toUpperCase().slice(0, 4);

  async function handleSelect(lang: Language) {
    setIsEditing(false);
    setQuery("");
    await setLanguage(lang.code);
  }

  function collapse() {
    setIsEditing(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* ── Collapsed: pill button ── */}
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold pixel-border bg-[var(--surface-light)] text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white transition-colors disabled:opacity-60"
          title={t("langDropdown.changeLanguage")}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  border: "2px solid currentColor",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            </>
          ) : (
            <>🌐</>
          )}
          <span>{isLoading ? "" : currentCode}</span>
        </button>
      ) : (
        /* ── Expanded: inline search input ── */
        <div
          className="flex items-center pixel-border bg-[var(--surface-light)]"
          style={{ minWidth: 160 }}
        >
          <span className="pl-2 text-sm">🌐</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={collapse}
            onKeyDown={(e) => {
              if (e.key === "Escape") collapse();
            }}
            placeholder={t("langDropdown.searchPlaceholder")}
            className="w-36 bg-transparent px-2 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none"
          />
          {isLoading && (
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                marginRight: 8,
                flexShrink: 0,
              }}
            />
          )}
        </div>
      )}

      {/* ── Results dropdown (only while editing) ── */}
      {isEditing && (
        <div
          className="absolute right-0 mt-1 glass-panel pixel-border z-[200] flex flex-col"
          style={{ minWidth: 240, maxHeight: 340, top: "100%" }}
        >
          <div className="overflow-y-auto flex-1">
            {results !== null ? (
              results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[var(--muted)] text-center">
                  {t("langDropdown.noResults")}
                </p>
              ) : (
                results.map((lang) => (
                  <LanguageRow
                    key={lang.code}
                    lang={lang}
                    isCurrent={lang.code === language}
                    isBundled={BUNDLED_LOCALES.has(lang.code)}
                    onSelect={handleSelect}
                  />
                ))
              )
            ) : (
              Object.entries(LANGUAGE_REGIONS).map(([region, langs]) => (
                <div key={region}>
                  <p className="px-3 pt-2 pb-0.5 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                    {region}
                  </p>
                  {langs.map((lang) => (
                    <LanguageRow
                      key={lang.code}
                      lang={lang}
                      isCurrent={lang.code === language}
                      isBundled={BUNDLED_LOCALES.has(lang.code)}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageRow({
  lang,
  isCurrent,
  isBundled,
  onSelect,
}: {
  lang: Language;
  isCurrent: boolean;
  isBundled: boolean;
  onSelect: (lang: Language) => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      onMouseDown={(e) => e.preventDefault()} // prevent blur before click
      onClick={() => onSelect(lang)}
      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--surface-light)] transition-colors"
      style={
        isCurrent
          ? { background: "rgba(108,92,231,0.18)", color: "var(--primary-text)" }
          : { color: "var(--foreground)" }
      }
    >
      <span className="flex-1 font-medium">{lang.name}</span>
      <span className="text-xs text-[var(--muted)]">{lang.nativeName}</span>
      <span
        title={isBundled ? t("langDropdown.instant") : t("langDropdown.onDemand")}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          flexShrink: 0,
          background: isBundled ? "var(--accent)" : "transparent",
          border: isBundled ? "none" : "1.5px solid var(--muted)",
        }}
      />
    </button>
  );
}
