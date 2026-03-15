# LingoLearn

> **Turn any YouTube video into an interactive learning experience. In 130+ languages.**

Built for the [Lingo.dev Hackathon](https://lingo.dev) | Powered by [Lingo.dev SDK](https://lingo.dev/) & [Groq AI](https://groq.com/)

---

## See It In Action

### Quick Promo
Get a quick overview of LingoLearn's key features and value proposition:

**[Watch Promo Video](https://youtu.be/A4kRh5K-mSo)**

### Full Project Demo
Watch the complete feature walkthrough and learn how LingoLearn transforms passive video watching into active learning:

**[Watch Full Demo Video](https://youtu.be/E97xhtWxmYY)**

---

## The Problem

YouTube is the world's largest classroom — but it's designed to distract, not teach.

- One scroll, one recommendation, and your 60-minute tutorial becomes a 3-hour rabbit hole
- Every detour costs 15–30 minutes of "re-entry tax" just to get back on track
- For 800M+ non-native English speakers, there's **no comprehension layer** — just passive watching and hoping it sticks

## The Solution

**LingoLearn** turns passive YouTube watching into active, **quiz-driven learning**.

Paste a URL → AI generates quizzes → You learn → You earn certificates

**Everything translates instantly into 130+ languages** using the Lingo.dev SDK.

**Passive watching becomes something you can actually prove.**

---

## Key Features

| Feature | Description |
|---------|-------------|
| **130+ Languages** | Full experience translation (not just captions) via Lingo.dev SDK, including RTL support |
| **Any YouTube Video** | Paste any URL and create a learning session instantly |
| **AI-Powered Quizzes** | Groq AI analyzes transcripts and generates contextual questions at natural breakpoints |
| **Two Learning Modes** | **Jolly Mode** (colorful, animated) or **Focus Mode** (minimal, distraction-free) |
| **15 Pixel Companions** | Unique characters (wizards, knights, rogues) that react to your answers |
| **Interactive Subtitles** | Translated subtitles with adjustable size, opacity, and position |
| **Auto-Save Sessions** | Resume exactly where you left off |
| **Certificates** | Downloadable PDF proof of completion |
| **Progress Dashboard** | Track all ongoing and completed sessions |
| **Curated Gallery** | 26+ learning paths across Coding, Cooking, Music, Science, Kids, Fitness, Art, and Language Learning |

---

## Platform Flow & Architecture

### User Journey
![Platform Flow](https://github.com/Prateek1771/LingoLearn/raw/main/public/platform_flow.png?raw=true)

### Video Processing Pipeline
![Video Logic](https://github.com/Prateek1771/LingoLearn/raw/main/public/Video_logic.png?raw=true)

### How It Works (Step-by-Step)

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
git clone https://github.com/Prateek1771/LingoLearn.git
cd LingoLearn

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

## Acknowledgements

A huge thank you to **[Lingo.dev](https://lingo.dev/)** for organizing this hackathon and providing the incredible translation SDK that powers LingoLearn's multilingual experience. The Lingo.dev SDK made it possible to go beyond simple captions and deliver a fully localized learning experience — quizzes, UI, companions, and certificates — in 130+ languages.

Thanks also to **[Groq](https://groq.com/)** for blazing-fast AI inference that makes real-time quiz generation feel instant.

---

## License

MIT

---

**Built with love for the [Lingo.dev Hackathon](https://lingo.dev/)** | *Your YouTube videos. Now taught back to you.*
