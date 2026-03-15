import { NextRequest, NextResponse } from "next/server";
import { translateAllContent } from "@/lib/lingo";
import { TranscriptSegment, Breakpoint } from "@/lib/types";

const DEFAULT_COMPANION_DIALOGUE = {
  quizPass: "Great job! You got it right!",
  quizFail: "Don't worry, try again!",
  breakpointReached: "Time for a quick check!",
  videoComplete: "Amazing! You completed the video!",
  encouragement: "You can do this!",
  greeting: "Let's learn together!",
  almostThere: "Almost there, keep going!",
  keepGoing: "Keep up the great work!",
};

const DEFAULT_CERTIFICATE_LABELS = {
  title: "Certificate of Completion",
  awardedTo: "Awarded to",
  forCompleting: "for completing",
  completionDate: "Completion Date",
  language: "Language",
  poweredBy: "Powered by LingoLearn",
};

export async function POST(request: NextRequest) {
  try {
    const { transcript, breakpoints, sourceLocale, targetLocale } =
      (await request.json()) as {
        transcript: TranscriptSegment[];
        breakpoints: Breakpoint[];
        sourceLocale: string;
        targetLocale: string;
      };

    if (!transcript || !breakpoints || !sourceLocale || !targetLocale) {
      return NextResponse.json(
        { error: "transcript, breakpoints, sourceLocale, and targetLocale are required" },
        { status: 400 }
      );
    }

    try {
      // If source and target are the same, skip transcript/breakpoint translation
      if (sourceLocale === targetLocale) {
        const { translateCompanionDialogue, translateCertificateLabels } = await import("@/lib/lingo");
        const [companionDialogue, certificateLabels] = await Promise.all([
          translateCompanionDialogue("en", targetLocale),
          translateCertificateLabels("en", targetLocale),
        ]);

        return NextResponse.json({
          translatedContent: {
            transcript,
            breakpoints,
            companionDialogue,
            certificateLabels,
          },
        });
      }

      const translatedContent = await translateAllContent(
        transcript,
        breakpoints,
        sourceLocale,
        targetLocale
      );

      return NextResponse.json({ translatedContent });
    } catch (lingoError) {
      // Lingo.dev not configured or rate-limited — fall back to original content
      // but still return 200 with fallback flag so the session can be created
      const errorMsg = lingoError instanceof Error ? lingoError.message : String(lingoError);
      console.warn("Lingo.dev translation failed, using original content:", errorMsg);
      return NextResponse.json({
        fallback: true,
        fallbackReason: errorMsg,
        translatedContent: {
          transcript,
          breakpoints,
          companionDialogue: DEFAULT_COMPANION_DIALOGUE,
          certificateLabels: DEFAULT_CERTIFICATE_LABELS,
        },
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to translate content";
    console.error("Translate error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
