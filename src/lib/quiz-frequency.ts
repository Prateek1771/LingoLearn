import { QuizFrequency } from "./types";

export function calculateQuizFrequency(durationSeconds: number): QuizFrequency {
  const minutes = durationSeconds / 60;

  if (minutes < 10) {
    return { maxBreakpoints: 2, questionsPerBreakpoint: 2 };
  } else if (minutes <= 30) {
    const breakpoints = Math.round(3 + ((minutes - 10) / 20));
    return { maxBreakpoints: Math.min(breakpoints, 4), questionsPerBreakpoint: 2 };
  } else if (minutes <= 60) {
    const breakpoints = Math.round(4 + ((minutes - 30) / 15));
    return { maxBreakpoints: Math.min(breakpoints, 6), questionsPerBreakpoint: 3 };
  } else if (minutes <= 120) {
    const breakpoints = Math.round(6 + ((minutes - 60) / 30));
    return { maxBreakpoints: Math.min(breakpoints, 8), questionsPerBreakpoint: 3 };
  } else {
    const breakpoints = Math.round(8 + ((minutes - 120) / 60));
    return { maxBreakpoints: Math.min(breakpoints, 10), questionsPerBreakpoint: 3 };
  }
}
