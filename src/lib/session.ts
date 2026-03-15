import {
  Session,
  SessionProgress,
  SessionStatus,
  VideoMetadata,
  TranscriptSegment,
  TranslatedContent,
  Breakpoint,
  QuizFrequency,
  LearningMode,
} from "./types";

const SESSIONS_KEY = "lingodev_sessions";

function generateId(): string {
  return `ld_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createSession(params: {
  videoUrl: string;
  metadata: VideoMetadata;
  sourceLocale: string;
  targetLocale: string;
  mode: LearningMode;
  companionId: string | null;
  originalTranscript: TranscriptSegment[];
  translatedContent: TranslatedContent;
  originalBreakpoints: Breakpoint[];
  quizFrequency: QuizFrequency;
  userName: string;
  rawTranscript?: TranscriptSegment[];
  quizzesGeneratedUpTo?: number;
}): Session {
  const breakpointCount = params.translatedContent.breakpoints.length;
  const session: Session = {
    id: generateId(),
    ...params,
    progress: {
      breakpointsCleared: new Array(breakpointCount).fill(false),
      attemptsPerBreakpoint: new Array(breakpointCount).fill(0),
      currentBreakpointIndex: 0,
      lastPlaybackPosition: 0,
    },
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const sessions = getAllSessions();
  sessions.push(session);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save session to localStorage:", e);
    }
  }

  return session;
}

export function getAllSessions(): Session[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(SESSIONS_KEY);
  try {
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getSession(id: string): Session | null {
  const sessions = getAllSessions();
  return sessions.find((s) => s.id === id) || null;
}

export function updateSession(id: string, updates: Partial<Session>): Session | null {
  const sessions = getAllSessions();
  const index = sessions.findIndex((s) => s.id === id);
  if (index === -1) return null;

  sessions[index] = { ...sessions[index], ...updates };
  // Explicitly delete keys set to undefined (spread doesn't remove them)
  for (const key of Object.keys(updates) as (keyof Session)[]) {
    if (updates[key] === undefined) {
      delete (sessions[index] as any)[key];
    }
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save session to localStorage:", e);
    }
  }
  return sessions[index];
}

export function updateProgress(
  id: string,
  progress: Partial<SessionProgress>
): Session | null {
  const session = getSession(id);
  if (!session) return null;

  const updatedProgress = { ...session.progress, ...progress };

  // Auto-calculate status
  let status: SessionStatus = session.status;
  const allCleared = updatedProgress.breakpointsCleared.every(Boolean);
  if (allCleared && updatedProgress.finalQuizPassed === true) {
    status = "completed";
  } else if (
    updatedProgress.lastPlaybackPosition > 0 ||
    updatedProgress.breakpointsCleared.some(Boolean)
  ) {
    status = "ongoing";
  }

  return updateSession(id, { progress: updatedProgress, status });
}

export function saveFinalQuiz(sessionId: string, quiz: Breakpoint | null): Session | null {
  return updateSession(sessionId, { finalQuiz: quiz });
}

export function markFinalQuizPassed(sessionId: string): Session | null {
  const s = updateProgress(sessionId, { finalQuizPassed: true });
  if (!s) return null;
  return updateSession(sessionId, { completedAt: new Date().toISOString() });
}

export function deleteSession(id: string): boolean {
  const sessions = getAllSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  if (filtered.length === sessions.length) return false;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to delete session from localStorage:", e);
      return false; // Indicate failure to save
    }
  }
  return true;
}

export function getSessionsByStatus(status: SessionStatus): Session[] {
  return getAllSessions().filter((s) => s.status === status);
}
