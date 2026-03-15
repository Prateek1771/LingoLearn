"use client";

import type { SubtitlePrefs } from "@/lib/subtitle-prefs";

interface SubtitleSettingsProps {
  prefs: SubtitlePrefs;
  onPrefsChange: (prefs: SubtitlePrefs) => void;
  onClose: () => void;
}

const FONT_SIZES = ["S", "M", "L"] as const;

export default function SubtitleSettings({
  prefs,
  onPrefsChange,
  onClose,
}: SubtitleSettingsProps) {
  return (
    <>
      {/* Backdrop to close on outside click */}
      <div
        className="fixed inset-0 z-20"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="
          absolute bottom-full right-0 mb-2 z-30
          w-52 p-3
          bg-surface-light border border-border rounded-lg
          shadow-xl shadow-black/60
          animate-fade-in
          flex flex-col gap-3
        "
      >
        {/* Dual mode toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            Show original
          </span>
          <button
            onClick={() =>
              onPrefsChange({ ...prefs, dualMode: !prefs.dualMode })
            }
            aria-label={prefs.dualMode ? "Hide original subtitles" : "Show original subtitles"}
            aria-pressed={prefs.dualMode}
            className={`
              relative w-9 h-5 rounded-full transition-colors duration-200
              ${prefs.dualMode ? "bg-primary" : "bg-border"}
            `}
          >
            <span
              className={`
                absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white
                transition-transform duration-200
                ${prefs.dualMode ? "translate-x-4" : "translate-x-0"}
              `}
            />
          </button>
        </div>

        {/* Separator */}
        <div className="h-px bg-border" />

        {/* Font size selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">
            Font size
          </span>
          <div className="flex gap-1">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onPrefsChange({ ...prefs, fontSize: size })}
                className={`
                  flex-1 py-1.5 rounded-md text-xs font-semibold
                  transition-colors duration-150
                  ${
                    prefs.fontSize === size
                      ? "bg-primary/20 text-primary-light"
                      : "text-muted hover:text-foreground hover:bg-border"
                  }
                `}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
