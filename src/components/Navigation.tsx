"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useTranslation } from "@/contexts/UILanguageContext";
import LanguageDropdown from "@/components/ui/LanguageDropdown";

export default function Navigation() {
  const pathname = usePathname();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const links = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.learn"), path: "/learn" },
    { name: t("nav.explore"), path: "/explore" },
    { name: t("nav.myLearnings"), path: "/my-learnings" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel pixel-border py-2 px-4 flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center bg-opacity-90 transition-all duration-500 max-w-[100vw] box-border">
      <div className="flex justify-between items-center w-full sm:col-span-1">
        <Link href="/" onClick={() => setIsMenuOpen(false)}>
          <span className="text-2xl font-extrabold pixel-text-strong tracking-widest text-[var(--primary-text)] whitespace-nowrap">
            LINGOLEARN
          </span>
        </Link>
        <button
          className="sm:hidden text-3xl p-1 pixel-text"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-menu"
        >
          {isMenuOpen ? "✖" : "☰"}
        </button>
      </div>

      <div id="mobile-nav-menu" className={`flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 ${isMenuOpen ? 'flex mt-4' : 'hidden sm:flex'} sm:col-span-1`}>
        {links.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`text-lg px-3 py-1 transition-colors ${
                isActive
                  ? "font-bold border-b-4 border-[var(--primary)] text-[var(--primary-text)]"
                  : "font-medium text-[var(--muted)] hover:text-[var(--primary-text)] text-[var(--foreground)]"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      <div className={`flex-col sm:flex-row items-center sm:justify-end gap-2 mt-4 sm:mt-0 ${isMenuOpen ? 'flex' : 'hidden sm:flex'} sm:col-span-1`}>
        <LanguageDropdown />
        <button
          onClick={toggleTheme}
          className="text-2xl p-2 hover:scale-110 transition-transform pixel-border bg-[var(--surface-light)]"
          title={t("nav.toggleTheme")}
        >
          {isDarkMode ? "🌙" : "☀️"}
        </button>
        <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
          <button className="flex items-center gap-2 px-4 py-2 font-bold pixel-border bg-[var(--surface-light)] text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white transition-colors">
            <span>👤</span> {t("nav.profile")}
          </button>
        </Link>
      </div>
    </nav>
  );
}
