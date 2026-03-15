import { LingoDotDevEngine } from "@lingo.dev/_sdk";
import {
  TranscriptSegment,
  Breakpoint,
  CompanionDialogue,
  CertificateLabels,
  TranslatedContent,
} from "./types";

function getEngine() {
  return new LingoDotDevEngine({
    apiKey: process.env.LINGODOTDEV_API_KEY!,
    ...(process.env.LINGODOTDEV_ENGINE_ID && { engineId: process.env.LINGODOTDEV_ENGINE_ID }),
  });
}

export async function detectLocale(text: string): Promise<string> {
  const engine = getEngine();
  return engine.recognizeLocale(text);
}

export async function translateText(
  text: string,
  sourceLocale: string,
  targetLocale: string
): Promise<string> {
  const engine = getEngine();
  return engine.localizeText(text, { sourceLocale, targetLocale });
}

export async function translateTranscript(
  segments: TranscriptSegment[],
  sourceLocale: string,
  targetLocale: string
): Promise<TranscriptSegment[]> {
  if (segments.length === 0) return [];
  const engine = getEngine();
  const texts = segments.map((s) => s.text);
  
  // Chunking to avoid payload too large errors
  const chunkSize = 50;
  const PARALLEL_BATCH = 3;
  const translated: string[] = [];
  const chunks: string[][] = [];
  for (let i = 0; i < texts.length; i += chunkSize) {
    chunks.push(texts.slice(i, i + chunkSize));
  }

  for (let i = 0; i < chunks.length; i += PARALLEL_BATCH) {
    const batch = chunks.slice(i, i + PARALLEL_BATCH);
    const results = await Promise.all(
      batch.map(chunk => engine.localizeStringArray(chunk, { sourceLocale, targetLocale }))
    );
    results.forEach(r => translated.push(...r));
  }

  return segments.map((seg, i) => ({
    ...seg,
    text: translated[i],
  }));
}

export async function translateBreakpoints(
  breakpoints: Breakpoint[],
  sourceLocale: string,
  targetLocale: string
): Promise<Breakpoint[]> {
  if (breakpoints.length === 0) return [];
  const engine = getEngine();

  const flatStrings: string[] = [];
  breakpoints.forEach((bp) => {
    flatStrings.push(bp.topic);
    bp.primaryQuestions.forEach((q) => {
      flatStrings.push(q.question);
      flatStrings.push(q.explanation || "");
      q.options.forEach(opt => flatStrings.push(opt));
    });
    bp.retryQuestions.forEach((q) => {
      flatStrings.push(q.question);
      flatStrings.push(q.explanation || "");
      q.options.forEach(opt => flatStrings.push(opt));
    });
  });

  if (flatStrings.length === 0) return breakpoints;

  // Chunking to avoid payload too large errors
  const chunkSize = 50;
  const PARALLEL_BATCH = 3;
  const translatedStrings: string[] = [];
  const chunks: string[][] = [];
  for (let i = 0; i < flatStrings.length; i += chunkSize) {
    chunks.push(flatStrings.slice(i, i + chunkSize));
  }

  for (let i = 0; i < chunks.length; i += PARALLEL_BATCH) {
    const batch = chunks.slice(i, i + PARALLEL_BATCH);
    const results = await Promise.all(
      batch.map(chunk => engine.localizeStringArray(chunk, { sourceLocale, targetLocale }))
    );
    results.forEach(r => translatedStrings.push(...r));
  }

  let ptr = 0;
  // Reconstruct breakpoints from translated flat array
  return breakpoints.map((bp) => {
    const topic = translatedStrings[ptr++];
    
    const primaryQuestions = bp.primaryQuestions.map((q) => {
      const question = translatedStrings[ptr++];
      const explanation = translatedStrings[ptr++];
      const options = q.options.map(() => translatedStrings[ptr++]);
      return { ...q, question, explanation, options };
    });
    
    const retryQuestions = bp.retryQuestions.map((q) => {
      const question = translatedStrings[ptr++];
      const explanation = translatedStrings[ptr++];
      const options = q.options.map(() => translatedStrings[ptr++]);
      return { ...q, question, explanation, options };
    });
    
    return { ...bp, topic, primaryQuestions, retryQuestions };
  });
}

export async function translateCompanionDialogue(
  sourceLocale: string,
  targetLocale: string
): Promise<CompanionDialogue> {
  const engine = getEngine();
  const defaultDialogue: CompanionDialogue = {
    quizPass: "Great job! You got it right!",
    quizFail: "Don't worry, try again!",
    breakpointReached: "Time for a quick check!",
    videoComplete: "Amazing! You completed the video!",
    encouragement: "You can do this!",
    greeting: "Let's learn together!",
    almostThere: "Almost there, keep going!",
    keepGoing: "Keep up the great work!",
  };

  const translated = await engine.localizeObject(
    defaultDialogue as unknown as Record<string, string>,
    { sourceLocale: "en", targetLocale }
  );

  return translated as unknown as CompanionDialogue;
}

export async function translateCertificateLabels(
  sourceLocale: string,
  targetLocale: string
): Promise<CertificateLabels> {
  const engine = getEngine();
  const defaultLabels: CertificateLabels = {
    title: "Certificate of Completion",
    awardedTo: "Awarded to",
    forCompleting: "for completing",
    completionDate: "Completion Date",
    language: "Language",
    poweredBy: "Powered by LingoLearn",
  };

  const translated = await engine.localizeObject(
    defaultLabels as unknown as Record<string, string>,
    { sourceLocale: "en", targetLocale }
  );

  return translated as unknown as CertificateLabels;
}

export async function translateUIStrings(
  strings: Record<string, string>,
  targetLocale: string
): Promise<Record<string, string>> {
  const engine = getEngine();
  return engine.localizeObject(strings, { sourceLocale: "en", targetLocale }) as Promise<Record<string, string>>;
}

export async function translateAllContent(
  transcript: TranscriptSegment[],
  breakpoints: Breakpoint[],
  sourceLocale: string,
  targetLocale: string
): Promise<TranslatedContent> {
  // Run all translations in parallel
  const [
    translatedTranscript,
    translatedBreakpoints,
    companionDialogue,
    certificateLabels,
  ] = await Promise.all([
    translateTranscript(transcript, sourceLocale, targetLocale),
    translateBreakpoints(breakpoints, sourceLocale, targetLocale),
    translateCompanionDialogue(sourceLocale, targetLocale),
    translateCertificateLabels(sourceLocale, targetLocale),
  ]);

  return {
    transcript: translatedTranscript,
    breakpoints: translatedBreakpoints,
    companionDialogue,
    certificateLabels,
  };
}
