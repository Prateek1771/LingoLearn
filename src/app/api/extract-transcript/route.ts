import { NextRequest, NextResponse } from "next/server";
import { extractTranscript } from "@/lib/ytdlp";
import { detectLocale } from "@/lib/lingo";
import { calculateQuizFrequency } from "@/lib/quiz-frequency";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    // Validate YouTube URL
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
    if (!ytRegex.test(url)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Extract transcript and metadata
    const { transcript, metadata } = await extractTranscript(url);

    // Detect locale from transcript text
    const sampleText = transcript
      .slice(0, Math.min(20, transcript.length))
      .map((s) => s.text)
      .join(" ");
    const detectedLocale = await detectLocale(sampleText);

    // Calculate quiz frequency
    const quizFrequency = calculateQuizFrequency(metadata.duration);

    return NextResponse.json({
      transcript,
      metadata,
      detectedLocale,
      quizFrequency,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to extract transcript";
    console.error("Extract transcript error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
