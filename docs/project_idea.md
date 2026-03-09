# LingoDev — Interactive Multilingual Video Learning Platform

## Vision
A universal interactive video learning platform that transforms any tutorial/learning video into a gamified, quiz-driven experience with AI-powered breakpoints, deep multilingual support via Lingo.dev, and companion characters. No age restrictions, no category limits — anyone can learn anything, in any language.

---

## Core Concept
Users paste any video URL, the platform auto-detects the video's language, user selects their preferred language, and the platform extracts transcripts, generates intelligent breakpoints with quizzes using AI, translates everything (subtitles, quizzes, companion dialogue, certificate) via Lingo.dev, and delivers a fully localized interactive learning session. Complete all quizzes to earn a personalized, localized certificate.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 + TypeScript |
| Styling | Tailwind CSS |
| Video Player | React Player |
| AI/LLM | Groq API (free tier) |
| Translation & Localization | Lingo.dev API/SDK (5 integration points) |
| Transcript Extraction | yt-dlp (YouTube only for hackathon) |
| Certificate | HTML/CSS on-screen + html2canvas + jsPDF for download |
| Storage | localStorage (hackathon scope) |

---

## Lingo.dev Integration Depth (5 Use Cases)

This is not a bolted-on translation layer. Lingo.dev is the product's core delivery mechanism.

| # | Use Case | Lingo.dev Feature |
|---|----------|-------------------|
| 1 | **Live subtitle translation** — real-time translated subtitles during video playback | `batchLocalizeText()` on timestamped transcript chunks |
| 2 | **Locale auto-detection** — detect video language before user picks target language | `recognizeLocale()` on extracted transcript |
| 3 | **Quiz translation** — all quiz questions, options, and explanations translated | Object translation preserving structure |
| 4 | **Companion dialogue translation** — "Great job!", "Try again!" in user's language | String translation for speech bubble text |
| 5 | **Certificate localization** — entire certificate rendered in target language | Object translation for structured certificate content |

---

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage — paste video URL or browse learning paths |
| `/learn/[sessionId]` | Video player + interactive quiz experience |
| `/explore` | Curated gallery + admin recommended (pre-populated for demo) |
| `/my-learnings` | User's learning dashboard (localStorage, ongoing/completed/pending) |
| `/certificate/[sessionId]` | Certificate view + download |

---

## Detailed User Flow

### Step 1: Landing
- User visits homepage
- Two options: **"Paste a Video"** or **"Browse Learning Paths"**

### Step 2: Setup
- Pastes video URL (YouTube — locked to YouTube for hackathon)
- Platform auto-detects video language using Lingo.dev `recognizeLocale()` → shows: *"We detected this video is in English"*
- User selects target language from **83+ languages powered by Lingo.dev** (grouped by region: European, Asian, Middle Eastern, etc.)
- Selects mode:
  - **Jolly Mode** — adventure-like, companion character, speech bubbles, fun background
  - **Focus Mode** — minimal, clean, distraction-free UI
- If Jolly Mode → picks from 3-4 pre-designed GIF companion characters

### Step 3: Processing (with Visual Progress UI)

User sees an animated step-by-step progress display (not a spinner):

1. **"Extracting transcript..."** → yt-dlp pulls captions + video metadata (duration)
   - If no captions found → show *"This video doesn't have captions available. Please try a video with captions enabled."*
2. **"Detecting language..."** → Lingo.dev `recognizeLocale()` confirms source language
3. **"Analyzing learning moments..."** → Quiz frequency formula calculates breakpoint count + questions per breakpoint
4. **"Generating quizzes..."** → Transcript chunked and sent to Groq API with instructions → returns breakpoints, quiz questions (primary + retry), and answer explanations
5. **"Translating to [Language] with Lingo.dev..."** → All content (subtitles, quizzes, companion dialogue) translated via Lingo.dev
6. **"Ready!"** → Session created, player loads

Each step lights up as it completes. The Lingo.dev step is explicitly named and visible to judges.

### Step 4: Learning Experience
- Video player loads with breakpoints visually marked on the progress bar
- **Live translated subtitles** displayed during playback — synced to video timestamps, translated via Lingo.dev
- **Player controls:** Play, pause, playback speed, seek/jump to sections
- Video auto-pauses at each breakpoint → quiz popup appears (fully in selected language)
- **RTL support:** If target language is Arabic/Hebrew/Urdu, quiz popup and subtitles render RTL via `dir="rtl"`
- **Quiz answer explanations:** After each answer (correct or incorrect), a brief explanation shows why the answer is correct
- **Pass:** Popup closes, video resumes to next segment
- **Fail:** Retry with a different set of questions on the same breakpoint content
- In Jolly Mode: GIF companion reacts with **translated speech bubbles** (e.g., "すごい!" in Japanese, "¡Excelente!" in Spanish)
- Companion walks/moves along a progress path as user advances

### Step 5: Completion
- **All breakpoint quizzes must be passed** to mark as complete
- Skipping ahead is allowed, but skipped quizzes remain unmarked
- Certificate **only unlocks** when every single quiz is cleared
- Congratulatory certificate generated — **fully localized via Lingo.dev:**
  - "Certificate of Completion" → "Certificado de Finalización" (Spanish), "修了証明書" (Japanese), etc.
  - User's name
  - Video/course title
  - Completion date (localized format)
  - Companion character avatar (if Jolly Mode was used)
  - Platform branding
- View on-screen (HTML/CSS) + Download as PDF

---

## Modes

### Jolly Mode
- Pick from **3-4 pre-designed GIF companion characters** (controlled quality, not open library)
- Each character has **3 states:** idle, celebration (quiz pass), encouragement (quiz fail)
- **Cursor follower** — the selected companion follows the user's cursor around the website, adding a playful, interactive feel throughout the entire experience
- **Translated speech bubbles** — companion dialogue in user's target language via Lingo.dev
- Slightly adventurous, playful background/theme
- Companion avatar appears on final certificate

### Focus Mode
- No companion character
- Clean, minimal, distraction-free UI
- Simple progress bar
- Just the video, subtitles, and quizzes — pure learning

---

## Quiz Frequency Control

To prevent quiz fatigue, breakpoint count and questions per breakpoint are determined by a simple formula based on video duration. Video duration is extracted from yt-dlp metadata (no extra API call needed).

### Formula

| Video Length | Breakpoints | Questions per Breakpoint | Retry Questions |
|-------------|-------------|------------------------|-----------------|
| < 10 min | 2 | 2 | 2 (different set) |
| 10-30 min | 3-4 | 2 | 2 (different set) |
| 30-60 min | 4-6 | 3 | 3 (different set) |
| 1-2 hrs | 6-8 | 3 | 3 (different set) |
| 2+ hrs | 8-10 | 3 | 3 (different set) |

### How It Works
1. **yt-dlp extracts video metadata** → gets duration (happens during transcript extraction, zero extra cost)
2. **Simple logic calculates** `maxBreakpoints` and `questionsPerBreakpoint`
3. **These numbers are passed as instructions to Groq** in the prompt: *"Create exactly X breakpoints with Y questions each at the most meaningful learning moments"*
4. **Groq picks the best placement** — AI decides WHERE the breakpoints go, the formula decides HOW MANY
5. **Groq also generates answer explanations** — brief explanation for each question on why the correct answer is correct
6. **Retry set:** Each breakpoint gets an equal number of different retry questions pre-generated by Groq

### Design Principle
- Shorter videos = fewer, focused checkpoints
- Longer videos = more breakpoints but capped at 3 questions to keep momentum
- AI chooses quality placement, formula controls quantity
- Retry always matches primary question count

---

## Live Subtitle Translation

The highest-impact Lingo.dev feature. Translated subtitles sync to the video in real-time.

### How It Works
1. yt-dlp extracts timestamped transcript (captions with start/end times)
2. Timestamped chunks sent to Lingo.dev `batchLocalizeText()` — preserving timestamp structure
3. Translated subtitles stored with the session
4. React Player renders subtitles via a custom positioned overlay div, synced to `onProgress` callback
5. User can toggle subtitles on/off

### Demo Moment
Play an English video → subtitles appear in Japanese in real-time. Switch language mid-demo → subtitles update. Judges see Lingo.dev working front-and-center on every frame of the video.

---

## RTL & Script Support

When the target language is RTL (Arabic, Hebrew, Urdu, etc.):
- Quiz popup container gets `dir="rtl"` attribute
- Subtitle overlay aligns right-to-left
- Tailwind CSS handles RTL layout natively
- ~2 hours of work, massive signal of localization depth to judges

---

## Explore Page (Simplified for Hackathon)

### Pre-Populated Gallery
- **8-10 hardcoded entries** that look like real community submissions
- Each card: video thumbnail, title, category tag, static star rating display
- **Category tags:** Coding, Cooking, Music, Science, Kids, Fitness, etc.
- Anyone can click and start learning from these entries

### Admin Recommended Section
- Curated picks highlighted at the top
- Hardcoded with example videos for demo showcase

### Post-Hackathon Roadmap (Mention in Pitch)
- Real community submissions with user accounts
- Live rating system with ranking by total ratings
- Multi-video learning paths (e.g., "Golang: Zero to Hero")

---

## My Learnings Page (`/my-learnings`)

**Storage:** localStorage only (no auth for hackathon)

### Tabs/Filters
- **Ongoing** — started but not all quizzes passed (shows progress %)
- **Completed** — all quizzes passed, certificate earned
- **Pending** — URL submitted & processed, but not started watching

### Learning Card Info
- Video thumbnail + title
- Language selected
- Progress bar (e.g., 3/7 breakpoints cleared)
- Mode used (Jolly/Focus)
- Date started

### Actions
- **Continue** — resume session where you left off
- **Delete** — remove from list
- **Share (link)** — generate a shareable link for anyone
- **Share to Community** — publish to Explore page

### Completed Cards Extra
- View Certificate button
- Download Certificate button

---

## AI/Quiz System Details

### Transcript Chunking Strategy
- Transcript split into chunks (by time segments or logical sections)
- Each chunk sent individually to Groq API
- Prevents token limit issues and improves response quality
- Enables parallel processing for speed

### Groq API Output (per chunk)
```json
{
  "breakpoint": {
    "timestamp": "05:32",
    "topic": "Understanding Variables"
  },
  "quiz": {
    "primary_questions": [
      {
        "question": "What is a variable?",
        "options": ["A", "B", "C", "D"],
        "correct": "A",
        "explanation": "A variable is a named container for storing data because..."
      }
    ],
    "retry_questions": [...]
  }
}
```

### Translation Pipeline
- Groq generates quizzes + explanations in English
- Lingo.dev API translates quiz objects to user's selected language (preserving JSON structure)
- Lingo.dev API translates timestamped transcript for subtitles
- Lingo.dev API translates companion dialogue strings
- All translated content cached for the session

### Retry Logic
- First attempt: Primary question set
- On fail: Different questions but same breakpoint content
- Both sets pre-generated by Groq for consistency
- Answer explanation shown after every answer (pass or fail)

---

## Certificate Details
- **On-screen:** Beautiful HTML/CSS rendered certificate — **fully localized via Lingo.dev**
- **Downloadable:** PDF via html2canvas + jsPDF
- **All labels translated:** "Certificate of Completion", "Awarded to", "for completing", date format — everything in target language
- **Contains:**
  - User's name
  - Video/course title (translated)
  - Language learned in
  - Completion date (localized format)
  - Companion character avatar (Jolly Mode only)
  - Platform branding

---

## Language Selector Design

- Display **83+ languages** supported by Lingo.dev
- Header: *"Choose from 83+ languages powered by Lingo.dev"*
- Grouped by region:
  - European (Spanish, French, German, Portuguese, etc.)
  - Asian (Japanese, Chinese, Korean, Hindi, etc.)
  - Middle Eastern (Arabic, Hebrew, Turkish, etc.)
  - African (Swahili, Amharic, etc.)
  - And more...
- Search/filter functionality for quick access

---

## Key Rules & Constraints
1. Certificate ONLY issued when ALL breakpoint quizzes are passed
2. User can seek/skip freely but must clear every quiz
3. Retry gives different questions, not the same ones
4. Video chunks sent to AI for better performance and load handling
5. Translation happens via Lingo.dev API/SDK, not the LLM — 5 distinct integration points
6. No age restrictions, no category restrictions — universal platform
7. Quiz frequency controlled by simple duration-based formula, not AI
8. YouTube only for hackathon (other platforms in roadmap)
9. localStorage for session persistence (no auth for hackathon)
10. RTL layout support for Arabic/Hebrew/Urdu languages

---

## Hackathon Scope Cuts (Build Post-Hackathon)
- Whisper fallback for videos without captions
- Community ratings and ranking system (faked with static data for demo)
- Multi-video learning paths / course sequencing
- Multi-platform support (Vimeo, Dailymotion, etc.)
- User authentication and multi-device sync
- Real community submissions

