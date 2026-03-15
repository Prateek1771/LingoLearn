/**
 * YouTube transcript extraction using the YouTube iOS InnerTube client.
 * No Python, no subprocesses — pure Node.js https, bypasses Next.js fetch patching.
 *
 * Language logic:
 *  1. Prefer manual English captions (.en)
 *  2. Then auto-generated English (a.en)
 *  3. If no English, pick the first available track
 *  4. If non-English captions are used, translate to English via Lingo.dev
 */

import type { TranscriptSegment, VideoMetadata, ExtractTranscriptResponse } from "./types";
import { translateTranscript } from "./lingo";

const YT_BASE = "https://www.youtube.com";

/** Pull video ID from any YouTube URL format */
export function extractVideoId(url: string): string {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  throw new Error("Could not extract video ID from URL: " + url);
}

interface CaptionTrack {
  vssId: string;
  languageCode: string;
  baseUrl: string;
}

interface InnerTubeEvent {
  tStartMs: number;
  dDurationMs?: number;
  segs?: Array<{ utf8: string }>;
}

/**
 * Raw HTTPS POST — bypasses Next.js global fetch patching/caching.
 * Next.js patches global fetch to add caching/deduplication; using node:https
 * directly ensures YouTube sees a clean, uncached request.
 */
async function rawPost(url: string, body: string, headers: Record<string, string>): Promise<string> {
  const { request } = await import("https");
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(body, "utf-8");
    const req = request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: { ...headers, "Content-Length": bodyBuf.length },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      }
    );
    req.on("error", reject);
    req.write(bodyBuf);
    req.end();
  });
}

async function rawGet(url: string): Promise<string> {
  const { request } = await import("https");
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: {
          "User-Agent": "com.google.ios.youtube/20.03.2 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X)",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

/** Fetch player data via YouTube iOS InnerTube client */
async function fetchPlayerData(videoId: string): Promise<Record<string, unknown>> {
  const body = JSON.stringify({
    context: {
      client: {
        clientName: "IOS",
        clientVersion: "20.03.2",
        deviceModel: "iPhone16,2",
        hl: "en",
        gl: "US",
      },
    },
    videoId,
  });
  const text = await rawPost(`${YT_BASE}/youtubei/v1/player?prettyPrint=false`, body, {
    "Content-Type": "application/json",
    "User-Agent": "com.google.ios.youtube/20.03.2 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X)",
    "X-YouTube-Client-Name": "5",
    "X-YouTube-Client-Version": "20.03.2",
  });
  return JSON.parse(text) as Record<string, unknown>;
}

/** Fetch and parse json3-format captions from a caption baseUrl */
async function fetchCaptionEvents(baseUrl: string): Promise<InnerTubeEvent[]> {
  const url = (baseUrl.startsWith("http") ? baseUrl : YT_BASE + baseUrl) + "&fmt=json3";
  const text = await rawGet(url);
  if (!text || text.length === 0) return [];
  try {
    const json = JSON.parse(text) as { events?: InnerTubeEvent[] };
    return (json.events ?? []).filter((e) => e.segs && e.segs.length > 0);
  } catch {
    return [];
  }
}

/** Convert InnerTube json3 events to TranscriptSegment[] */
function eventsToSegments(events: InnerTubeEvent[]): TranscriptSegment[] {
  return events
    .map((e) => ({
      start: e.tStartMs / 1000,
      end: (e.tStartMs + (e.dDurationMs ?? 0)) / 1000,
      text: (e.segs ?? [])
        .map((s) => s.utf8)
        .join("")
        .replace(/\n/g, " ")
        .trim(),
    }))
    .filter((s) => s.text.length > 0);
}

export async function extractTranscript(
  youtubeUrl: string
): Promise<ExtractTranscriptResponse> {
  const videoId = extractVideoId(youtubeUrl);
  const playerData = await fetchPlayerData(videoId);

  const playability = playerData?.playabilityStatus as Record<string, unknown> | undefined;
  const status = playability?.status as string | undefined;

  if (status && status !== "OK" && status !== "LIVE_STREAM_OFFLINE") {
    const reason = (playability?.reason as string) ?? status;
    throw new Error(`Video is not available: ${reason}. Please try a different public YouTube video.`);
  }

  // Extract metadata from videoDetails
  const videoDetails = playerData?.videoDetails as Record<string, unknown> | undefined;
  const title = (videoDetails?.title as string) ?? "Unknown Video";
  const durationSecs = parseInt((videoDetails?.lengthSeconds as string) ?? "0", 10);
  const channelName = (videoDetails?.author as string) ?? "";
  const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  // Get caption tracks
  const captionRenderer = (
    (playerData?.captions as Record<string, unknown>)
      ?.playerCaptionsTracklistRenderer as Record<string, unknown>
  )?.captionTracks as CaptionTrack[] | undefined;

  const tracks: CaptionTrack[] = captionRenderer ?? [];

  if (tracks.length === 0) {
    throw new Error(
      "No captions available for this video. Please try a video that has captions enabled."
    );
  }

  // Priority: manual EN > auto-generated EN > any available track
  const enManual = tracks.find((t) => t.vssId === ".en");
  const enAuto = tracks.find((t) => t.vssId === "a.en");
  const enTrack = enManual ?? enAuto ?? null;
  const bestTrack = enTrack ?? tracks[0];
  const captionLang = bestTrack.languageCode ?? "en";
  const isEnglish = enTrack !== null;

  const events = await fetchCaptionEvents(bestTrack.baseUrl);
  if (events.length === 0) {
    throw new Error("Failed to fetch caption content. Please try a different video.");
  }

  let transcript = eventsToSegments(events);

  // Translate non-English captions to English via Lingo.dev
  if (!isEnglish && captionLang !== "en") {
    try {
      transcript = await translateTranscript(transcript, captionLang, "en");
    } catch {
      // If translation fails, proceed with original captions
    }
  }

  const metadata: VideoMetadata = {
    title,
    duration: durationSecs,
    thumbnail,
    channelName,
  };

  return { transcript, metadata };
}
