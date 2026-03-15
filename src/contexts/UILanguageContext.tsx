"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { defaultTranslations, type TranslationKey } from "@/lib/ui-translations";
import { BUNDLED_TRANSLATIONS, BUNDLED_LOCALES } from "@/lib/ui-translation-bundles";
import { isRTL } from "@/lib/languages";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UILanguageContextType {
  language: string;
  isLoading: boolean;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  setLanguage: (code: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UILanguageContext = createContext<UILanguageContextType>({
  language: "en",
  isLoading: false,
  t: (key) => defaultTranslations[key] ?? key,
  setLanguage: async () => {},
});

// ─── Cache helpers ────────────────────────────────────────────────────────────

function cacheKey(code: string) {
  return `ui-translations-${code}`;
}

function loadCache(code: string): Record<TranslationKey, string> | null {
  try {
    const raw = localStorage.getItem(cacheKey(code));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(code: string, data: Record<TranslationKey, string>) {
  try {
    localStorage.setItem(cacheKey(code), JSON.stringify(data));
  } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UILanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState("en");
  const [translations, setTranslations] = useState<Record<TranslationKey, string>>(defaultTranslations);
  const [isLoading, setIsLoading] = useState(false);

  // On mount: restore saved language
  useEffect(() => {
    const saved = localStorage.getItem("ui-language");
    if (saved && saved !== "en") {
      applyLanguage(saved, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Apply translations for a language code. skipSave=false means also persist to localStorage. */
  const applyLanguage = useCallback(async (code: string, persist = true) => {
    if (code === "en") {
      setTranslations(defaultTranslations);
      setLang("en");
      document.documentElement.dir = "ltr";
      if (persist) localStorage.setItem("ui-language", "en");
      return;
    }

    // 1. Bundled translations — instant, no API call
    if (BUNDLED_LOCALES.has(code)) {
      setTranslations({ ...defaultTranslations, ...BUNDLED_TRANSLATIONS[code] });
      setLang(code);
      document.documentElement.dir = isRTL(code) ? "rtl" : "ltr";
      if (persist) localStorage.setItem("ui-language", code);
      return;
    }

    // 2. localStorage cache hit — instant
    const cached = loadCache(code);
    if (cached) {
      setTranslations(cached);
      setLang(code);
      document.documentElement.dir = isRTL(code) ? "rtl" : "ltr";
      if (persist) localStorage.setItem("ui-language", code);
      return;
    }

    // 3. API call for unlisted languages
    const prevLang = language;
    const prevTranslations = translations;
    setIsLoading(true);
    try {
      const res = await fetch("/api/ui-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLocale: code }),
      });
      if (!res.ok) throw new Error("Translation API failed");
      const data = await res.json();
      const newTranslations = data.translations as Record<TranslationKey, string>;
      saveCache(code, newTranslations);
      setTranslations(newTranslations);
      setLang(code);
      document.documentElement.dir = isRTL(code) ? "rtl" : "ltr";
      if (persist) localStorage.setItem("ui-language", code);
    } catch (err) {
      console.error("UI translation failed:", err);
      // Revert on error
      setTranslations(prevTranslations);
      setLang(prevLang);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, translations]);

  const setLanguage = useCallback(
    (code: string) => applyLanguage(code, true),
    [applyLanguage]
  );

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const raw =
        (translations as Record<string, string>)[key] ??
        (defaultTranslations as Record<string, string>)[key] ??
        key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
    },
    [translations]
  );

  return (
    <UILanguageContext.Provider value={{ language, isLoading, t, setLanguage }}>
      {children}
    </UILanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTranslation() {
  return useContext(UILanguageContext);
}
