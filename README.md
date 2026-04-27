# AniGuesser Web 🎮

A modern, dark-themed anime guessing game built with **Next.js 14**, **Tailwind CSS**, **Lucide React**, and **Framer Motion**.

## 🎯 Game Modes

### 1. Anime Wordle
Guess the target anime in up to 8 tries. Each guess reveals comparison clues:
- **Release Year** — `Earlier`, `Later`, or `Correct`
- **Rating/Score** — `Higher`, `Lower`, or `Correct`
- **Genres** — matching genres are highlighted in green
- **Studio** — `Correct` or `Incorrect`

### 2. Screenshot Guesser
Identify an anime from its cover art. Type or search the anime title with autocomplete suggestions.

### 3. Character & Series Guesser
Identify an anime character and their series. Score points for one or both correct answers.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🌐 Jikan API Integration

Anime Wordle and Screenshot Guesser use the **[Jikan API](https://jikan.moe/)** (Unofficial MyAnimeList API) for:
- Anime search/autocomplete (`GET /v4/anime?q=<title>`)
- Anime detail fetching (`GET /v4/anime/<id>`)

**Assumptions & Notes:**
- Jikan is a public, rate-limited API — no API key is needed.
- Rate limit: ~3 requests/second. The app debounces autocomplete input at 400ms.
- On API failures or empty responses, the app gracefully falls back to `data/animeData.ts` (20 local entries).
- API responses are cached with `next: { revalidate }` for performance.

---

## 📁 Project Structure

```
aniguesser-web/
├── app/
│   ├── globals.css          # Global styles + Tailwind
│   ├── layout.tsx           # Root HTML layout
│   └── page.tsx             # Main dashboard (client component)
├── components/
│   ├── Navigation.tsx       # Mode-switching nav bar
│   ├── modes/
│   │   ├── AnimeWordle.tsx      # Wordle game mode
│   │   ├── ScreenshotGuesser.tsx # Screenshot game mode
│   │   └── CharacterGuesser.tsx # Character game mode
│   └── ui/
│       ├── AutocompleteInput.tsx # Jikan-backed search input
│       ├── Badge.tsx            # Colored result badge
│       └── Card.tsx             # Glassmorphism card container
├── data/
│   └── animeData.ts         # 20 local fallback anime entries
├── lib/
│   └── jikan.ts             # Jikan API client + normalization
└── types/
    └── anime.ts             # TypeScript data model definitions
```

---

## 🛠 Tech Stack

| Technology | Usage |
|---|---|
| Next.js 14 (App Router) | Framework + SSR |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations & transitions |
| Lucide React | Icons |
| Jikan API | Live anime data |
