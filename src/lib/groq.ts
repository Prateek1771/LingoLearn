import Groq from "groq-sdk";
import { Breakpoint, QuizQuestion, TranscriptSegment } from "./types";

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! });
}

function buildSystemPrompt(
  breakpointCount: number,
  questionsPerBreakpoint: number
): string {
  return `You are an expert educational content analyzer. Your job is to analyze video transcript segments and create meaningful learning breakpoints with quiz questions.

INSTRUCTIONS:
1. Analyze the transcript and identify exactly ${breakpointCount} key learning moments (breakpoints).
2. For each breakpoint, create:
   - A timestamp (in seconds) where the breakpoint should occur (AFTER the concept is explained)
   - A short topic title (3-7 words)
   - ${questionsPerBreakpoint} primary quiz questions (multiple choice with 4 options each)
   - ${questionsPerBreakpoint} retry quiz questions (different questions covering the same concept)
   - A brief explanation for each question explaining why the correct answer is correct

3. Space breakpoints evenly across the transcript - don't cluster them together.
4. Questions should test comprehension, not memorization of exact words.
5. Make incorrect options plausible but clearly wrong to someone who understood the content.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "breakpoints": [
    {
      "timestamp": <seconds as number>,
      "topic": "<short topic title>",
      "primaryQuestions": [
        {
          "question": "<question text>",
          "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
          "correct": <index 0-3 of correct option>,
          "explanation": "<why the correct answer is correct>"
        }
      ],
      "retryQuestions": [
        {
          "question": "<different question on same topic>",
          "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
          "correct": <index 0-3 of correct option>,
          "explanation": "<why the correct answer is correct>"
        }
      ]
    }
  ]
}`;
}

export function chunkTranscript(
  transcript: TranscriptSegment[],
  maxChunkTokens: number = 2000
): TranscriptSegment[][] {
  const chunks: TranscriptSegment[][] = [];
  let currentChunk: TranscriptSegment[] = [];
  let currentTokens = 0;

  for (const segment of transcript) {
    const segTokens = Math.ceil(segment.text.split(/\s+/).length * 1.3); // rough token estimate
    if (currentTokens + segTokens > maxChunkTokens && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentTokens = 0;
    }
    currentChunk.push(segment);
    currentTokens += segTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function formatChunkForPrompt(chunk: TranscriptSegment[]): string {
  return chunk
    .map((seg) => {
      const mins = Math.floor(seg.start / 60);
      const secs = Math.floor(seg.start % 60);
      return `[${mins}:${secs.toString().padStart(2, "0")}] ${seg.text}`;
    })
    .join("\n");
}

function is429(err: unknown): boolean {
  if (err && typeof err === "object") {
    const status = (err as Record<string, unknown>).status;
    return status === 429;
  }
  return false;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroq(
  client: Groq,
  chunk: TranscriptSegment[],
  bpCount: number,
  questionsPerBreakpoint: number
): Promise<Breakpoint[]> {
  const chunkText = formatChunkForPrompt(chunk);
  const chunkStart = chunk[0].start;
  const chunkEnd = chunk[chunk.length - 1].end;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(bpCount, questionsPerBreakpoint),
      },
      {
        role: "user",
        content: `Analyze this transcript segment (from ${Math.floor(chunkStart / 60)}:${Math.floor(chunkStart % 60).toString().padStart(2, "0")} to ${Math.floor(chunkEnd / 60)}:${Math.floor(chunkEnd % 60).toString().padStart(2, "0")}) and create ${bpCount} breakpoint(s) with ${questionsPerBreakpoint} questions each:\n\n${chunkText}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return (parsed.breakpoints || []) as Breakpoint[];
  } catch {
    console.error("Failed to parse Groq response:", content);
    return [];
  }
}

async function processChunkWithRetry(
  client: Groq,
  chunk: TranscriptSegment[],
  bpCount: number,
  questionsPerBreakpoint: number
): Promise<Breakpoint[]> {
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      return await callGroq(client, chunk, bpCount, questionsPerBreakpoint);
    } catch (err) {
      if (is429(err) && attempt < 3) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`Rate limit hit, retrying in ${Math.round(backoffMs)}ms (attempt ${attempt + 1}/3)`);
        await delay(backoffMs);
        continue;
      }
      if (!is429(err)) {
        console.error("Non-rate-limit error in chunk, skipping:", err);
        return [];
      }
      throw err;
    }
  }
  return [];
}

export async function generateQuizzes(
  transcript: TranscriptSegment[],
  maxBreakpoints: number,
  questionsPerBreakpoint: number
): Promise<Breakpoint[]> {
  const client = getClient();
  const chunks = chunkTranscript(transcript);

  // Distribute breakpoints across chunks
  const breakpointsPerChunk = chunks.map((_, i) => {
    const base = Math.floor(maxBreakpoints / chunks.length);
    const remainder = maxBreakpoints % chunks.length;
    return base + (i < remainder ? 1 : 0);
  });

  // Process chunks sequentially to avoid rate limits
  const results: Breakpoint[][] = [];
  for (const [i, chunk] of chunks.entries()) {
    const bpCount = breakpointsPerChunk[i];
    if (bpCount === 0) {
      results.push([]);
      continue;
    }
    const result = await processChunkWithRetry(client, chunk, bpCount, questionsPerBreakpoint);
    results.push(result);
  }

  // Flatten and sort by timestamp
  const allBreakpoints = results.flat().sort((a, b) => a.timestamp - b.timestamp);

  // Ensure we don't exceed maxBreakpoints
  return allBreakpoints.slice(0, maxBreakpoints);
}

export async function generateQuizzesForRange(
  transcript: TranscriptSegment[],
  startSec: number,
  endSec: number,
  maxBreakpoints: number,
  questionsPerBreakpoint: number
): Promise<Breakpoint[]> {
  const rangeTranscript = transcript.filter(
    (seg) => seg.start < endSec && seg.end > startSec
  );
  if (rangeTranscript.length === 0) return [];
  return generateQuizzes(rangeTranscript, maxBreakpoints, questionsPerBreakpoint);
}
