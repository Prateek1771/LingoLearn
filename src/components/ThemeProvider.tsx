"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem("lingodev-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else if (
      !savedTheme &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      // Optional: Auto-detect system dark mode, but defaults to light for now
      // setIsDarkMode(true);
      // document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("lingodev-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("lingodev-theme", "light");
      }
      return next;
    });
  };

  // Always render the Provider so useTheme doesn't crash on initial server render.
  // We use a safe default before mounted.
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {/* Hide contents until mounted to prevent flash of wrong theme */}
      <div style={{ visibility: mounted ? "visible" : "hidden", display: "contents" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
