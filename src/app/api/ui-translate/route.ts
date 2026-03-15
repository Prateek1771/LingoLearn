import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { defaultTranslations } from "@/lib/ui-translations";
import { translateUIStrings } from "@/lib/lingo";

async function translateWithGroq(
  strings: Record<string, string>,
  targetLocale: string
): Promise<Record<string, string> | null> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const prompt = `Translate ALL values in this JSON object from English to locale "${targetLocale}".
Rules:
- Keep every JSON key exactly as-is
- Only translate the string values
- Preserve emoji, {placeholder} tokens, and punctuation exactly
- Return ONLY valid JSON, no markdown, no explanation

${JSON.stringify(strings)}`;

  try {
    const res = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    });

    const content = res.choices[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    const valid = Object.keys(strings).every((k) => k in parsed);
    return valid ? (parsed as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { targetLocale } = await req.json();
    if (!targetLocale || typeof targetLocale !== "string") {
      return NextResponse.json({ error: "targetLocale required" }, { status: 400 });
    }

    // English — return defaults
    if (targetLocale === "en") {
      return NextResponse.json({ translations: defaultTranslations, source: "default" });
    }

    const strings = { ...defaultTranslations } as Record<string, string>;

    // Try Groq first
    const groqResult = await translateWithGroq(strings, targetLocale);
    if (groqResult) {
      return NextResponse.json({ translations: groqResult, source: "groq" });
    }

    // Fallback to Lingo.dev
    const lingoResult = await translateUIStrings(strings, targetLocale);
    return NextResponse.json({ translations: lingoResult, source: "lingo" });
  } catch (err) {
    console.error("ui-translate error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
