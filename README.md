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

### 3. Movie Wordle
Guess the target anime in up to 8 tries. Each guess reveals comparison clues:
- **Release Year** — `Earlier`, `Later`, or `Correct`
- **Rating/Score** — `Higher`, `Lower`, or `Correct`
- **Genres** — matching genres are highlighted in green

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Install & Run

```bash
# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env

# Create and migrate the database
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | SQLite file path (or Postgres URL for production) | `file:./dev.db` |
| `JWT_SECRET` | Long random secret for signing session tokens | `openssl rand -base64 32` |

### Build for Production

```bash
npm run build
npm start
```

> **Production note:** Switch `DATABASE_URL` to a hosted Postgres instance (e.g., Neon, Supabase, PlanetScale) by updating your environment variables. The Prisma schema supports both SQLite and Postgres — only the `provider` field in `prisma/schema.prisma` needs changing.

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
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts       # POST — sign in with username + password
│   │       ├── logout/route.ts      # POST — clear session cookie
│   │       ├── me/route.ts          # GET  — return current user from session
│   │       └── register/route.ts    # POST — create new account
│   ├── globals.css          # Global styles + Tailwind
│   ├── layout.tsx           # Root HTML layout
│   └── page.tsx             # Main dashboard (client component)
├── components/
│   ├── modes/
│   │   ├── AnimeWordle.tsx      # Wordle game mode
│   │   ├── ScreenshotGuesser.tsx # Screenshot game mode
│   │   └── MovieWordle.tsx      # Movie wordle game mode
│   └── ui/
│       ├── AuthModal.tsx        # Sign in / sign up modal
│       ├── AutocompleteInput.tsx # Jikan-backed search input
│       ├── Badge.tsx            # Colored result badge
│       └── Card.tsx             # Glassmorphism card container
├── data/
│   └── animeData.ts         # 20 local fallback anime entries
├── hooks/
│   └── useAuth.ts           # Auth state + API calls (sign in/up/out)
├── lib/
│   ├── auth.ts              # (deprecated) — replaced by API routes
│   ├── db.ts                # Prisma client singleton
│   ├── jikan.ts             # Jikan API client + normalization
│   ├── leaderboard.ts       # Leaderboard helpers
│   └── session.ts           # JWT sign/verify + cookie helpers
├── prisma/
│   ├── migrations/          # Auto-generated SQL migrations
│   └── schema.prisma        # Database schema (User model)
└── types/
    └── anime.ts             # TypeScript data model definitions
```

---

## 🛠 Tech Stack

| Technology | Usage |
|---|---|
| Next.js 15 (App Router) | Framework + API routes |
| TypeScript | Type safety |
| Prisma 5 + SQLite | Database ORM + migrations |
| bcryptjs | Password hashing |
| jose | JWT session tokens |
| Tailwind CSS | Styling |
| Framer Motion | Animations & transitions |
| Lucide React | Icons |
| Jikan API | Live anime data |
