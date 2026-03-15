export interface SubtitlePrefs {
  dualMode: boolean;
  fontSize: "S" | "M" | "L";
}

const PREFS_KEY = "lingodev_subtitle_prefs";

const DEFAULT_PREFS: SubtitlePrefs = { dualMode: false, fontSize: "M" };

export function getSubtitlePrefs(): SubtitlePrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveSubtitlePrefs(prefs: SubtitlePrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
