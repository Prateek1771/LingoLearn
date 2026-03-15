import { NextRequest, NextResponse } from "next/server";
import { generateQuizzes, generateQuizzesForRange } from "@/lib/groq";
import { TranscriptSegment } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { transcript, maxBreakpoints, questionsPerBreakpoint, startTime, endTime } =
      (await request.json()) as {
        transcript: TranscriptSegment[];
        maxBreakpoints: number;
        questionsPerBreakpoint: number;
        startTime?: number;
        endTime?: number;
      };

    if (!transcript || !maxBreakpoints || !questionsPerBreakpoint) {
      return NextResponse.json(
        { error: "transcript, maxBreakpoints, and questionsPerBreakpoint are required" },
        { status: 400 }
      );
    }

    const breakpoints =
      startTime !== undefined && endTime !== undefined
        ? await generateQuizzesForRange(transcript, startTime, endTime, maxBreakpoints, questionsPerBreakpoint)
        : await generateQuizzes(transcript, maxBreakpoints, questionsPerBreakpoint);

    return NextResponse.json({ breakpoints });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate quizzes";
    console.error("Generate quizzes error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
