export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface VideoMetadata {
  title: string;
  duration: number; // seconds
  thumbnail: string;
  channelName: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // index of correct option
  explanation: string;
}

export interface Breakpoint {
  timestamp: number; // seconds into video
  topic: string;
  primaryQuestions: QuizQuestion[];
  retryQuestions: QuizQuestion[];
}

export interface QuizFrequency {
  maxBreakpoints: number;
  questionsPerBreakpoint: number;
}

export interface TranslatedContent {
  transcript: TranscriptSegment[];
  breakpoints: Breakpoint[];
  companionDialogue: CompanionDialogue;
  certificateLabels: CertificateLabels;
}

export interface CompanionDialogue {
  quizPass: string;
  quizFail: string;
  breakpointReached: string;
  videoComplete: string;
  encouragement: string;
  greeting: string;
  almostThere: string;
  keepGoing: string;
}

export interface CertificateLabels {
  title: string; // "Certificate of Completion"
  awardedTo: string; // "Awarded to"
  forCompleting: string; // "for completing"
  completionDate: string; // "Completion Date"
  language: string; // "Language"
  poweredBy: string; // "Powered by LingoDev"
}

export type LearningMode = "jolly" | "focus";

export type SessionStatus = "pending" | "ongoing" | "completed";

export interface CompanionCharacter {
  id: string;
  name: string;
  description?: string;
  idleGif: string;
  celebrationGif: string;
  encouragementGif: string;
}

export interface Session {
  id: string;
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
  progress: SessionProgress;
  status: SessionStatus;
  createdAt: string;
  completedAt?: string;
  userName: string;
  rawTranscript?: TranscriptSegment[];       // full transcript for lazy prefetch calls
  quizzesGeneratedUpTo?: number;              // high-water mark (seconds)
  finalQuiz?: Breakpoint | null;             // undefined = not generated, null = no questions
}

export interface SessionProgress {
  breakpointsCleared: boolean[];
  attemptsPerBreakpoint: number[];
  currentBreakpointIndex: number;
  lastPlaybackPosition: number;
  finalQuizPassed?: boolean;
}

export interface ExtractTranscriptResponse {
  transcript: TranscriptSegment[];
  metadata: VideoMetadata;
}

export interface GenerateQuizzesResponse {
  breakpoints: Breakpoint[];
}

export interface TranslateResponse {
  translatedContent: TranslatedContent;
}
