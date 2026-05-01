"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, Trophy, Film, Search, CheckCircle2,
  XCircle, ChevronUp, ChevronDown, Share2, Flame,
} from "lucide-react";
import { Movie, MovieGuessResult } from "@/types/movie";
import { movieData } from "@/data/movieData";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const MAX_GUESSES = 8;
const STATS_KEY = "movie-wordle-stats";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function pickRandom(exclude?: number): Movie {
  const pool = exclude !== undefined ? movieData.filter((m) => m.id !== exclude) : movieData;
  return pool[Math.floor(Math.random() * pool.length)];
}

function compareMovies(guess: Movie, target: Movie): MovieGuessResult {
  const yearResult: MovieGuessResult["yearResult"] =
    guess.releaseYear > target.releaseYear ? "Earlier"
    : guess.releaseYear < target.releaseYear ? "Later"
    : "Correct";
  const ratingResult: MovieGuessResult["ratingResult"] =
    guess.rating > target.rating ? "Lower"
    : guess.rating < target.rating ? "Higher"
    : "Correct";
  const matchingGenres = guess.genres.filter((g) => target.genres.includes(g));
  const directorResult: MovieGuessResult["directorResult"] =
    guess.director.trim().toLowerCase() === target.director.trim().toLowerCase() ? "Correct" : "Incorrect";
  return { movie: guess, yearResult, ratingResult, matchingGenres, directorResult };
}

function normalise(s: string): string { return s.trim().toLowerCase(); }

function loadStats(): Stats {
  if (typeof window === "undefined") return { wins: 0, losses: 0, streak: 0, bestStreak: 0 };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { wins: 0, losses: 0, streak: 0, bestStreak: 0 };
  } catch { return { wins: 0, losses: 0, streak: 0, bestStreak: 0 }; }
}

function saveStats(s: Stats): void {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/** Build Wordle-style emoji grid for sharing */
function buildShareText(guesses: MovieGuessResult[], won: boolean, target: Movie): string {
  const rows = guesses.map((g) => {
    const y = g.yearResult === "Correct" ? "🟩" : "🟨";
    const r = g.ratingResult === "Correct" ? "🟩" : "🟨";
    const genres = g.matchingGenres.length > 0 ? "🟩" : "⬛";
    const d = g.directorResult === "Correct" ? "🟩" : "⬛";
    return `${y}${r}${genres}${d}`;
  });
  const score = won ? `${guesses.length}/${MAX_GUESSES}` : "X/8";
  return `🎬 Movie Wordle — ${score}\n\n${rows.join("\n")}\n\n#MovieWordle`;
}

// ─── Confetti particle ────────────────────────────────────────────────────────

function ConfettiBlast() {
  const colors = ["#00ff88", "#6c63ff", "#ff6b9d", "#ffd700", "#00d4ff"];
  const particles = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 1.2 + Math.random() * 0.8,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ left: `${p.x}%`, top: "0%", backgroundColor: p.color }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: 180, opacity: 0, scale: 0.4, rotate: 360 * (p.id % 2 === 0 ? 1 : -1) }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

// ─── ResultRow ────────────────────────────────────────────────────────────────

function ResultRow({ result, index }: { result: MovieGuessResult; index: number }) {
  const yearVariant = result.yearResult === "Correct" ? "correct" : result.yearResult === "Earlier" ? "earlier" : "later";
  const ratingVariant = result.ratingResult === "Correct" ? "correct" : result.ratingResult === "Higher" ? "higher" : "lower";

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="grid grid-cols-[auto_1fr_auto_auto_1fr_auto] gap-2 items-center p-2.5 rounded-lg bg-anime-card border border-anime-border"
    >
      {/* Poster thumbnail */}
      <div className="w-8 h-12 rounded-md overflow-hidden flex-shrink-0 border border-anime-border/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result.movie.posterUrl}
          alt={result.movie.title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/32x48/13132a/6c63ff?text=🎬"; }}
        />
      </div>

      {/* Title + Director */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{result.movie.title}</p>
        <p className="text-xs text-gray-400 truncate">{result.movie.director}</p>
      </div>

      {/* Year */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Year</p>
        <Badge variant={yearVariant}>
          {result.yearResult === "Correct" ? <><CheckCircle2 className="w-3 h-3" />{result.movie.releaseYear}</>
          : result.yearResult === "Earlier" ? <><ChevronUp className="w-3 h-3" />{result.movie.releaseYear}</>
          : <><ChevronDown className="w-3 h-3" />{result.movie.releaseYear}</>}
        </Badge>
      </div>

      {/* IMDb */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">IMDb</p>
        <Badge variant={ratingVariant}>
          {result.ratingResult === "Correct" ? `✓ ${result.movie.rating}`
          : result.ratingResult === "Higher" ? `↑ ${result.movie.rating}`
          : `↓ ${result.movie.rating}`}
        </Badge>
      </div>

      {/* Genres */}
      <div>
        <p className="text-xs text-gray-500 mb-0.5">Genres</p>
        <div className="flex flex-wrap gap-1">
          {result.movie.genres.map((g) => (
            <Badge key={g} variant={result.matchingGenres.includes(g) ? "match" : "neutral"}>{g}</Badge>
          ))}
        </div>
      </div>

      {/* Director match */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Dir.</p>
        <Badge variant={result.directorResult === "Correct" ? "correct" : "incorrect"}>
          {result.directorResult === "Correct"
            ? <><CheckCircle2 className="w-3 h-3" />✓</>
            : <XCircle className="w-3 h-3" />}
        </Badge>
      </div>
    </motion.div>
  );
}

// ─── PosterReveal ─────────────────────────────────────────────────────────────

function PosterReveal({ movie, won }: { movie: Movie; won: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex flex-col sm:flex-row gap-5 items-start"
    >
      <div className="relative flex-shrink-0">
        <div className={`w-32 h-48 rounded-xl overflow-hidden border-2 ${won ? "border-anime-green/60" : "border-red-500/60"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={movie.posterUrl} alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/128x192/13132a/6c63ff?text=🎬"; }}
          />
        </div>
        {won && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="absolute -top-3 -right-3 w-8 h-8 bg-anime-yellow/20 border border-anime-yellow/50 rounded-full flex items-center justify-center"
          >
            <Trophy className="w-4 h-4 text-anime-yellow" />
          </motion.div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xl font-bold text-white">{movie.title}</p>
        <p className="text-sm italic text-anime-pink mt-0.5">{movie.tagline}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {movie.genres.map((g) => <Badge key={g} variant="neutral">{g}</Badge>)}
        </div>
        <div className="mt-2 space-y-0.5 text-xs text-gray-400">
          <p><span className="text-gray-500">Director:</span> {movie.director}</p>
          <p><span className="text-gray-500">Year:</span> {movie.releaseYear}</p>
          <p><span className="text-gray-500">IMDb:</span> <span className="text-anime-yellow font-semibold">⭐ {movie.rating}</span></p>
        </div>
        <p className="text-xs text-gray-400 mt-2 line-clamp-3">{movie.synopsis}</p>
      </div>
    </motion.div>
  );
}

// ─── MovieAutocompleteInput ───────────────────────────────────────────────────

interface MovieAutocompleteInputProps {
  onSelect: (movie: Movie) => void;
  disabled: boolean;
  guessedIds: Set<number>;
}

function MovieAutocompleteInput({ onSelect, disabled, guessedIds }: MovieAutocompleteInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    if (query.trim().length < 1) return [];
    return movieData.filter(
      (m) => m.title.toLowerCase().includes(query.toLowerCase()) && !guessedIds.has(m.id)
    );
  }, [query, guessedIds]);

  // Reset active index when filtered list changes
  useEffect(() => { setActiveIdx(-1); }, [filtered]);

  const handleSelect = (movie: Movie) => {
    onSelect(movie);
    setQuery("");
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(filtered[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a movie... (↑↓ to navigate, Enter to select)"
          disabled={disabled}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-anime-card border border-anime-border text-white placeholder-gray-600 focus:outline-none focus:border-anime-pink/60 transition-colors disabled:opacity-50"
        />
        {query && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-xl bg-anime-card border border-anime-border shadow-xl"
          >
            {filtered.map((movie, idx) => (
              <li key={movie.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(movie)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    idx === activeIdx ? "bg-anime-pink/20 border-l-2 border-anime-pink" : "hover:bg-anime-border/40"
                  }`}
                >
                  {/* Mini poster */}
                  <div className="w-7 h-10 rounded overflow-hidden flex-shrink-0 bg-anime-border/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.posterUrl} alt={movie.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/28x40/13132a/6c63ff?text=🎬"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">{movie.title}</p>
                    <p className="text-xs text-gray-500 truncate">{movie.director}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">{movie.releaseYear}</p>
                    <p className="text-xs text-anime-yellow">⭐ {movie.rating}</p>
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: Stats }) {
  const total = stats.wins + stats.losses;
  const winPct = total > 0 ? Math.round((stats.wins / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
      <div className="flex items-center gap-1">
        <Trophy className="w-3 h-3 text-anime-yellow" />
        <span className="text-white font-semibold">{stats.wins}</span> wins
      </div>
      <div className="text-gray-700">·</div>
      <div>{winPct}% win rate</div>
      {stats.streak > 0 && (
        <>
          <div className="text-gray-700">·</div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-orange-400 font-semibold">{stats.streak}</span> streak
          </div>
        </>
      )}
      {stats.bestStreak > 1 && (
        <>
          <div className="text-gray-700">·</div>
          <div>Best: <span className="text-white font-semibold">{stats.bestStreak}</span></div>
        </>
      )}
    </div>
  );
}

// ─── Main: MovieWordle ────────────────────────────────────────────────────────

export default function MovieWordle() {
  const [target, setTarget] = useState<Movie>(() => pickRandom());
  const [guesses, setGuesses] = useState<MovieGuessResult[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [stats, setStats] = useState<Stats>({ wins: 0, losses: 0, streak: 0, bestStreak: 0 });
  const [copied, setCopied] = useState(false);

  // Load stats from localStorage on mount
  useEffect(() => { setStats(loadStats()); }, []);

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.movie.id)), [guesses]);
  const remaining = MAX_GUESSES - guesses.length;

  const handleGuess = useCallback(
    (movie: Movie) => {
      if (gameOver || guessedIds.has(movie.id)) return;
      const result = compareMovies(movie, target);
      const newGuesses = [...guesses, result];
      setGuesses(newGuesses);

      if (normalise(movie.title) === normalise(target.title)) {
        setWon(true);
        setGameOver(true);
        setStats((prev) => {
          const next: Stats = {
            wins: prev.wins + 1,
            losses: prev.losses,
            streak: prev.streak + 1,
            bestStreak: Math.max(prev.bestStreak, prev.streak + 1),
          };
          saveStats(next);
          return next;
        });
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
        setStats((prev) => {
          const next: Stats = { wins: prev.wins, losses: prev.losses + 1, streak: 0, bestStreak: prev.bestStreak };
          saveStats(next);
          return next;
        });
      }
    },
    [guesses, target, gameOver, guessedIds]
  );

  const reset = () => {
    setTarget(pickRandom(target.id));
    setGuesses([]);
    setGameOver(false);
    setWon(false);
    setCopied(false);
  };

  const handleShare = async () => {
    const text = buildShareText(guesses, won, target);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">

      {/* 1. Header Card */}
      <Card glow="none">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-anime-pink/20 border border-anime-pink/40 flex items-center justify-center flex-shrink-0">
              <Film className="w-4 h-4 text-anime-pink" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-none">Movie Wordle</p>
              <p className="text-xs text-gray-500 leading-none mt-0.5">
                {gameOver ? (won ? "🎉 You got it!" : "💀 Game over") : `${remaining} guess${remaining !== 1 ? "es" : ""} left`}
              </p>
            </div>
          </div>

          {/* Pip dots */}
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_GUESSES }).map((_, i) => {
              const guessed = i < guesses.length;
              const isLast = i === guesses.length - 1;
              let cls = "w-2 h-2 rounded-full transition-colors ";
              if (gameOver && isLast && won) cls += "bg-anime-green";
              else if (gameOver && guesses.length >= MAX_GUESSES && i === MAX_GUESSES - 1 && !won) cls += "bg-red-500";
              else if (guessed) cls += "bg-anime-pink/70";
              else cls += "bg-anime-border";
              return <span key={i} className={cls} />;
            })}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {gameOver && (
              <button
                onClick={handleShare}
                title="Share result"
                className="p-2 rounded-lg text-gray-400 hover:text-anime-green hover:bg-anime-card border border-transparent hover:border-anime-border transition-all"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-anime-green" /> : <Share2 className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={reset}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-anime-card border border-transparent hover:border-anime-border transition-all"
              title="New game"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-2 pt-2 border-t border-anime-border/40">
          <StatsBar stats={stats} />
        </div>
      </Card>

      {/* 2. Hint legend */}
      <div className="flex flex-wrap gap-1.5 text-xs text-gray-500 items-center">
        <span>Hints:</span>
        <Badge variant="correct">✓ Correct</Badge>
        <Badge variant="earlier">↑ Earlier</Badge>
        <Badge variant="later">↓ Later</Badge>
        <Badge variant="higher">↑ Higher IMDb</Badge>
        <Badge variant="lower">↓ Lower IMDb</Badge>
        <Badge variant="match">Genre Match</Badge>
      </div>

      {/* 3. Input */}
      {!gameOver && (
        <MovieAutocompleteInput onSelect={handleGuess} disabled={gameOver} guessedIds={guessedIds} />
      )}

      {/* 4. Win/Lose banner */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
            className={`relative overflow-hidden p-4 rounded-xl border ${
              won ? "bg-anime-green/10 border-anime-green/40" : "bg-red-500/10 border-red-500/40"
            }`}
          >
            {won && <ConfettiBlast />}
            <p className={`text-lg font-bold mb-3 ${won ? "text-anime-green" : "text-red-400"}`}>
              {won
                ? `🎉 Correct in ${guesses.length} guess${guesses.length !== 1 ? "es" : ""}!`
                : `😞 The answer was \u201c${target.title}\u201d`}
            </p>

            <PosterReveal movie={target} won={won} />

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleShare}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-colors ${
                  copied
                    ? "bg-anime-green/20 border-anime-green/40 text-anime-green"
                    : "bg-anime-card border-anime-border text-gray-300 hover:text-white hover:border-anime-pink/50"
                }`}
              >
                {copied ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share</>}
              </button>
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-anime-accent text-white hover:bg-anime-accent/80 transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Column headers */}
      {guesses.length > 0 && (
        <div className="grid grid-cols-[auto_1fr_auto_auto_1fr_auto] gap-2 px-2.5 text-xs text-gray-500 font-medium">
          <span className="w-8" />
          <span>Title / Director</span>
          <span className="text-center">Year</span>
          <span className="text-center">IMDb</span>
          <span>Genres</span>
          <span className="text-center">Dir.</span>
        </div>
      )}

      {/* 6. Guess rows */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {guesses.map((result, i) => (
            <ResultRow key={result.movie.id} result={result} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* 7. Empty state */}
      {guesses.length === 0 && !gameOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-gray-600">
          <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Search and select a movie to make your first guess!</p>
          <p className="text-xs mt-1">You have {MAX_GUESSES} attempts. Use ↑↓ keys to navigate suggestions.</p>
        </motion.div>
      )}

    </div>
  );
}
