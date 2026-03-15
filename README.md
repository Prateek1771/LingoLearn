# LingoDev

**Turn any YouTube video into a multilingual classroom, instantly.**

LingoDev is an interactive video learning platform that transforms passive YouTube watching into active, quiz-driven learning experiences in 130+ languages. Built for the [Lingo.dev Hackathon](https://lingo.dev).

---

## The Problem

YouTube is the world's largest classroom — but it's designed to distract, not teach. One scroll, one recommendation, and your 60-minute tutorial becomes a 3-hour rabbit hole. Every detour costs 15–30 minutes of "re-entry tax" just to get back on track. And for 800M+ non-native English speakers learning from English content, there's no comprehension layer — just passive watching and hoping it sticks.

## The Solution

LingoDev keeps you locked in. Paste any YouTube URL, pick your language, and start learning. AI-generated quizzes pop up at natural topic breaks — the video pauses and asks you what you just learned. The entire experience (quizzes, subtitles, UI, certificates) translates into 130+ languages via the Lingo.dev SDK. Finish the video, pass the quizzes, walk away with a certificate.

**Passive watching becomes something you can actually prove.**

---

## Features

- **Universal Video Learning** — Paste any YouTube URL and instantly create a learning session
- **130+ Languages** — Full experience translation (not just captions) via Lingo.dev SDK, including RTL support
- **AI-Powered Quizzes** — Groq AI analyzes transcripts and generates contextual quiz questions at natural breakpoints
- **Two Learning Modes**
  - **Jolly Mode** — Colorful, animated UI with pixel-art companion characters
  - **Focus Mode** — Minimal, distraction-free interface for serious learners
- **15 Pixel Companions** — Unique characters (wizards, knights, rogues) that react to your answers
- **Interactive Subtitles** — Translated subtitles with adjustable size, opacity, and position
- **Session Persistence** — Resume exactly where you left off, every session auto-saved
- **Completion Certificates** — Downloadable PDF certificates with your name, video, and language
- **Progress Dashboard** — Track all your ongoing and completed learning sessions
- **Explore Gallery** — 26+ curated learning paths across Coding, Cooking, Music, Science, Kids, Fitness, Art, and Language Learning
- **Adaptive Quiz Frequency** — Longer videos get proportionally more quizzes

---

## How It Works

```
1. Paste a YouTube URL
2. Choose your target language (130+ options)
3. Pick a learning mode (Jolly or Focus) and a companion
4. AI extracts the transcript and generates quizzes at topic breakpoints
5. Watch the video — quizzes pop up at natural breaks
6. Pass quizzes to continue, retry with different questions if you miss
7. Complete the final quiz to earn your certificate
```

### Under the Hood

```
YouTube URL → Transcript Extraction (InnerTube API)
           → Language Detection (Lingo.dev SDK)
           → Quiz Generation (Groq AI / LLaMA 3.3-70b)
           → Content Translation (Lingo.dev SDK)
           → Interactive Learning Session
           → Certificate Generation (html2canvas + jsPDF)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 + React 19 + TypeScript 5 |
| Styling | Tailwind CSS v4 (dark/light themes, glassmorphism) |
| AI / Quizzes | Groq SDK (LLaMA 3.3-70b-versatile) |
| Translation | Lingo.dev SDK (@lingo.dev/_sdk) |
| Video | react-player v3 |
| Transcript | YouTube InnerTube API (iOS client) |
| Certificates | html2canvas + jsPDF |
| Storage | localStorage (fully client-side) |
| Font | VT323 (pixel/retro aesthetic) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing homepage
│   ├── learn/
│   │   ├── page.tsx                      # Setup form (URL, language, mode)
│   │   └── [sessionId]/page.tsx          # Main learning session
│   ├── explore/page.tsx                  # Curated video gallery
│   ├── my-learnings/page.tsx             # Session history
│   ├── certificate/[sessionId]/page.tsx  # Certificate display & download
│   ├── community/page.tsx                # Community tutorials (WIP)
│   ├── profile/page.tsx                  # User profile (WIP)
│   └── api/
│       ├── extract-transcript/           # YouTube transcript extraction
│       ├── generate-quizzes/             # AI quiz generation
│       ├── translate/                    # Content translation
│       └── ui-translate/                 # UI string translation
├── components/
│   ├── video-player/                     # VideoPlayer, ProgressBar, Subtitles
│   ├── quiz/                             # QuizPopup, QuizOption
│   ├── companion/                        # CursorFollower, SpeechBubble
│   └── ui/                              # LanguageSelector, ProcessingSteps
├── contexts/
│   └── UILanguageContext.tsx             # Global UI language provider
├── lib/
│   ├── types.ts                         # Core TypeScript interfaces
│   ├── session.ts                       # Session CRUD (localStorage)
│   ├── lingo.ts                         # Lingo.dev SDK wrapper
│   ├── groq.ts                          # Groq AI quiz generation
│   ├── ytdlp.ts                         # YouTube transcript extraction
│   ├── languages.ts                     # 130+ language definitions + RTL
│   ├── companions.ts                    # 15 companion character configs
│   └── quiz-frequency.ts               # Adaptive quiz density
└── data/
    └── explore-data.ts                  # Curated gallery entries
```

---

## API Routes

### `POST /api/extract-transcript`
Extracts transcript and metadata from any YouTube URL using the InnerTube API.

### `POST /api/generate-quizzes`
Sends transcript chunks to Groq AI (LLaMA 3.3-70b) to generate breakpoints with primary and retry quiz questions.

### `POST /api/translate`
Translates all content (transcript, quizzes, companion dialogue, certificate labels) via Lingo.dev SDK with batched parallel processing.

### `POST /api/ui-translate`
Translates UI strings with a 3-tier strategy: bundled translations (instant) → localStorage cache → dynamic API (Groq/Lingo.dev).

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Groq API Key](https://console.groq.com)
- [Lingo.dev API Key](https://lingo.dev)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lingodev.git
cd lingodev

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key
LINGODOTDEV_API_KEY=your_lingodotdev_api_key
```

### Run

```bash
# Development
npm run dev

# Production build
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) and start learning.

---

## Quiz Frequency Algorithm

Quizzes adapt to video length:

| Video Duration | Breakpoints | Questions per Breakpoint |
|---------------|-------------|------------------------|
| < 10 min | 2 | 2 |
| 10–30 min | 3–4 | 2 |
| 30–60 min | 4–6 | 3 |
| 60–120 min | 6–8 | 3 |
| > 120 min | 8–10 (capped) | 3 |

Quizzes for the first 20 minutes are generated upfront. Remaining quizzes are lazily prefetched in the background as you watch.

---

## Language Support

**130+ languages** organized across 9 regions:

- **Popular** — English, Spanish, French, German, Chinese, Japanese, Korean, Hindi, Arabic, Russian, and more
- **European** — Dutch, Polish, Romanian, Czech, Hungarian, Greek, Swedish, and 30+ others
- **South Asian** — Bengali, Tamil, Telugu, Marathi, Malayalam, and more
- **East & Southeast Asian** — Thai, Vietnamese, Indonesian, Tagalog, Khmer, and more
- **Middle Eastern** — Hebrew, Persian, Urdu, Kurdish (with full RTL support)
- **African** — Swahili, Amharic, Yoruba, Zulu, and 15+ others
- **Americas & Pacific** — Regional variants, Hawaiian, Maori, and more
- **Constructed** — Esperanto, Latin, Sanskrit

RTL languages (Arabic, Hebrew, Urdu, Persian, etc.) are auto-detected and the entire UI flips direction accordingly.

---

## Design

- **Dark/Light themes** with CSS variable system and glassmorphism panels
- **Pixel-art aesthetic** — VT323 font, chunky borders, retro animations
- **Responsive** — Works on desktop and mobile
- **Accessible** — Keyboard navigation, adjustable subtitle settings

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| No backend database | Fully client-side with localStorage — zero setup, instant demo |
| Raw HTTPS for YouTube | Bypasses Next.js fetch patching for reliable transcript extraction |
| Chunked translation | Avoids payload-too-large errors from Lingo.dev API |
| Lazy quiz prefetch | Quizzes generated in background after initial segment loads |
| Fallback translations | Session creation succeeds even if translation partially fails |
| Adaptive quiz frequency | Prevents quiz fatigue on long videos while maintaining engagement on short ones |

---

## Built With

- [Next.js](https://nextjs.org/) — React framework
- [Lingo.dev SDK](https://lingo.dev/) — Multilingual translation engine
- [Groq](https://groq.com/) — Ultra-fast AI inference (LLaMA 3.3-70b)
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [react-player](https://github.com/cookpete/react-player) — YouTube video playback

---

## License

MIT

---

**Built for the Lingo.dev Hackathon** | *Your YouTube videos. Now taught back to you.*
