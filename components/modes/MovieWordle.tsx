"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, Trophy, Film, Search, CheckCircle2,
  XCircle, ChevronUp, ChevronDown, Share2, PlayCircle, HelpCircle, Flag, BookOpen
} from "lucide-react";
import { Movie, MovieGuessResult } from "@/types/movie";
import { movieData } from "@/data/movieData";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { submitScore } from "@/lib/leaderboard";

const MAX_GUESSES = 8;
const STATS_KEY = "movie-wordle-stats";

interface MovieStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  bestScore: number; // fewest guesses to win; 0 means no win yet
}

const DEFAULT_STATS: MovieStats = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestScore: 0,
};

function useMovieStats() {
  const [stats, setStats] = useState<MovieStats>(() => {
    if (typeof window === "undefined") return DEFAULT_STATS;
    try {
      const raw = localStorage.getItem(STATS_KEY);
      return raw ? (JSON.parse(raw) as MovieStats) : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  const updateStats = useCallback((outcome: "win" | "lose", guessCount?: number) => {
    setStats((prev) => {
      const next: MovieStats = {
        gamesPlayed: prev.gamesPlayed + 1,
        wins: outcome === "win" ? prev.wins + 1 : prev.wins,
        currentStreak: outcome === "win" ? prev.currentStreak + 1 : 0,
        bestStreak:
          outcome === "win"
            ? Math.max(prev.bestStreak, prev.currentStreak + 1)
            : prev.bestStreak,
        bestScore:
          outcome === "win" && guessCount !== undefined
            ? prev.bestScore === 0
              ? guessCount
              : Math.min(prev.bestScore, guessCount)
            : prev.bestScore,
      };
      if (typeof window !== "undefined") {
        try { localStorage.setItem(STATS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  }, []);

  return { stats, updateStats };
}

function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ctxRef.current;
  }

  function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    gainValue = 0.3
  ) {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore AudioContext errors */ }
  }

  const playGuess = useCallback(() => {
    playTone(440, 0.1, "sine", 0.2);
  }, []);

  const playWin = useCallback(() => {
    // Ascending arpeggio: C5 E5 G5 C6
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, "sine", 0.25), i * 120);
    });
  }, []);

  const playLose = useCallback(() => {
    // Descending two notes
    playTone(300, 0.3, "square", 0.2);
    setTimeout(() => playTone(200, 0.4, "square", 0.2), 250);
  }, []);

  return { playGuess, playWin, playLose };
}

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

function buildShareText(
  guesses: MovieGuessResult[],
  won: boolean,
  maxGuesses: number
): string {
  const header = `🎬 AniGuesser Movie Wordle ${won ? guesses.length : "X"}/${maxGuesses}`;
  const rows = guesses.map((g) => {
    const yearEmoji =
      g.yearResult === "Correct" ? "🟩" : g.yearResult === "Earlier" ? "🔼" : "🔽";
    const ratingEmoji =
      g.ratingResult === "Correct" ? "🟩" : g.ratingResult === "Higher" ? "🔼" : "🔽";
    const genreEmoji = g.matchingGenres.length > 0 ? "🟩" : "⬜";
    const dirEmoji = g.directorResult === "Correct" ? "🟩" : "⬜";
    return `${yearEmoji}${ratingEmoji}${genreEmoji}${dirEmoji}`;
  });
  return [header, ...rows].join("\n");
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  width: number;
  height: number;
}

const CONFETTI_COLORS = ["#6c63ff", "#ff6b9d", "#00ff88", "#ffd700", "#00d4ff"];

function ConfettiOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4 - canvas.height * 0.1,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      width: Math.random() * 8 + 4,
      height: Math.random() * 5 + 3,
    }));

    let startTime: number | null = null;
    const DURATION = 2500; // ms
    let rafId: number;

    function draw(timestamp: number) {
      if (!ctx || !canvas) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Global fade out in final 500ms
      ctx.globalAlpha = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07; // gravity
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }

      ctx.globalAlpha = 1;

      if (progress < 1) {
        rafId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[200] pointer-events-none"
      aria-hidden="true"
    />
  );
}

function ResultRow({ result, index }: { result: MovieGuessResult; index: number }) {
  const yearVariant = result.yearResult === "Correct" ? "correct" : result.yearResult === "Earlier" ? "earlier" : "later";
  const ratingVariant = result.ratingResult === "Correct" ? "correct" : result.ratingResult === "Higher" ? "higher" : "lower";

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="grid grid-cols-[auto_minmax(0,1.5fr)_auto_auto_minmax(0,2fr)_auto] gap-2 items-center p-3 rounded-lg bg-anime-card border border-anime-border"
    >
      <div className="shrink-0 w-10 h-14 rounded-lg overflow-hidden border border-anime-border bg-anime-card hidden sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result.movie.posterUrl}
          alt={result.movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{result.movie.title}</p>
        <p className="text-xs text-gray-400 truncate">{result.movie.director}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Year</p>
        <Badge variant={yearVariant}>
          {result.yearResult === "Correct" ? <><CheckCircle2 className="w-3 h-3" />{result.movie.releaseYear}</>
          : result.yearResult === "Earlier" ? <><ChevronUp className="w-3 h-3" />{result.movie.releaseYear}</>
          : <><ChevronDown className="w-3 h-3" />{result.movie.releaseYear}</>}
        </Badge>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">IMDb</p>
        <Badge variant={ratingVariant}>
          {result.ratingResult === "Correct" ? `✓ ${result.movie.rating}`
          : result.ratingResult === "Higher" ? `↑ ${result.movie.rating}`
          : `↓ ${result.movie.rating}`}
        </Badge>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">Genres</p>
        <div className="flex flex-wrap gap-1">
          {result.movie.genres.map((g) => (
            <Badge key={g} variant={result.matchingGenres.includes(g) ? "match" : "neutral"}>{g}</Badge>
          ))}
        </div>
      </div>
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
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-2">{movie.synopsis}</p>
        {movie.watchUrl && (
          <a
            href={movie.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-anime-pink/15 hover:bg-anime-pink/25 border border-anime-pink/40 text-anime-pink text-xs font-semibold transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Watch Now
          </a>
        )}
      </div>
    </motion.div>
  );
}

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

  const filtered = useMemo(() => {
    if (query.trim().length < 1) return [];
    return movieData.filter(
      (m) => m.title.toLowerCase().includes(query.toLowerCase()) && !guessedIds.has(m.id)
    );
  }, [query, guessedIds]);

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
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a movie..."
          disabled={disabled}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-anime-card border border-anime-border text-white placeholder-gray-600 focus:outline-none focus:border-anime-pink/60 transition-colors disabled:opacity-50"
        />
      </div>
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
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
                  className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors ${
                    idx === activeIdx ? "bg-anime-pink/20" : "hover:bg-anime-border/40"
                  }`}
                >
                  <div className="shrink-0 w-8 h-12 rounded overflow-hidden border border-anime-border bg-anime-card flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <span className="text-white truncate font-medium pt-1 flex-1">{movie.title}</span>
                  <span className="ml-auto text-xs text-gray-600 flex-shrink-0 pl-2 pt-1">{movie.releaseYear}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MovieWordle() {
  const [target, setTarget] = useState<Movie>(() => pickRandom());
  const [guesses, setGuesses] = useState<MovieGuessResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTaglineHint, setShowTaglineHint] = useState(false);

  const { stats, updateStats } = useMovieStats();
  const { playGuess, playWin, playLose } = useSound();
  const { user } = useAuth();

  const SYNOPSIS_HINT_THRESHOLD = 5;

  useEffect(() => {
    if (gameOver) setShowTaglineHint(false);
  }, [gameOver]);

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.movie.id)), [guesses]);
  const remaining = MAX_GUESSES - guesses.length;

  // Show synopsis hint after 5 wrong guesses and game still active
  const showSynopsisHint = !gameOver && guesses.length >= SYNOPSIS_HINT_THRESHOLD && !!target.synopsis;

  const handleGuess = useCallback(
    (movie: Movie) => {
      if (gameOver || guessedIds.has(movie.id)) return;
      const result = compareMovies(movie, target);
      const newGuesses = [...guesses, result];
      setGuesses(newGuesses);
      
      playGuess();

      if (normalise(movie.title) === normalise(target.title)) {
        setWon(true);
        setGameOver(true);
        updateStats("win", newGuesses.length);
        playWin();
        setTotalScore(s => s + (MAX_GUESSES - guesses.length) * 15);
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
        updateStats("lose");
        playLose();
      }
    },
    [guesses, target, gameOver, guessedIds, updateStats, playGuess, playWin, playLose]
  );

  const handleGiveUp = () => {
    if (gameOver) return;
    setGaveUp(true);
    setGameOver(true);
    updateStats("lose");
    playLose();
  };

  const reset = () => {
    setTarget(pickRandom(target.id));
    setGuesses([]);
    setGameOver(false);
    setWon(false);
    setGaveUp(false);
    setCopied(false);
    setShowTaglineHint(false);
  };

  // Save score to leaderboard when game ends with a positive score
  useEffect(() => {
    if (gameOver && user && totalScore > 0) {
      submitScore("movie", user.id, user.username, totalScore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  const handleShare = useCallback(async () => {
    const text = buildShareText(guesses, won, MAX_GUESSES);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [guesses, won]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12">
      {won && gameOver && <ConfettiOverlay key={guesses.length} />}
      
      {/* Header */}
      <div className="text-center space-y-8">
        <h2 className="text-6xl font-nabla tracking-[0.2em] text-white brightness-0 invert uppercase">
          Movie Wordle
        </h2>
        <p className="text-gray-400 text-sm font-sans tracking-wide">
          Guess the movie in {MAX_GUESSES} tries. Each guess reveals clues.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="w-full relative flex items-end justify-between px-2 font-sans py-4 pb-2 border-white/10">
        <div className="flex flex-col items-start">
          <span className="text-white text-lg font-semibold tracking-wide">
            Guesses: <span className={guesses.length >= MAX_GUESSES - 2 ? "text-red-400" : "text-white"}>
              {guesses.length}/{MAX_GUESSES}
            </span>
          </span>
        </div>
        
        <div className="absolute left-1/2 bottom-[-10px] -translate-x-1/2">
           <div className="flex flex-col items-center">
              <span className="text-5xl font-nabla brightness-0 invert tracking-widest text-white">
                SCORE: {totalScore}
              </span>
           </div>
        </div>

        <div className="flex flex-col items-end">
          <button
            onClick={reset}
            className="text-white text-lg font-semibold tracking-wide hover:text-gray-300 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs text-gray-500 items-center justify-center">
        <span>Hints:</span>
        <Badge variant="correct">✓ Correct</Badge>
        <Badge variant="earlier">↑ Earlier</Badge>
        <Badge variant="later">↓ Later</Badge>
        <Badge variant="higher">↑ Higher IMDb</Badge>
        <Badge variant="lower">↓ Lower IMDb</Badge>
        <Badge variant="match">Genre Match</Badge>
      </div>

      {!gameOver && (
        <div className="flex items-start gap-2">
          {/* Search input — takes all available space */}
          <div className="flex-1">
            <MovieAutocompleteInput
              onSelect={handleGuess}
              disabled={gameOver}
              guessedIds={guessedIds}
            />
          </div>

          {/* Hint icon with tagline tooltip */}
          <div className="relative flex-shrink-0 mt-0.5">
            <button
              onMouseEnter={() => setShowTaglineHint(true)}
              onMouseLeave={() => setShowTaglineHint(false)}
              onFocus={() => setShowTaglineHint(true)}
              onBlur={() => setShowTaglineHint(false)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-anime-card border border-anime-border text-gray-500 hover:text-anime-pink hover:border-anime-pink/40 transition-colors"
              aria-label="Show tagline hint"
              type="button"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Tooltip */}
            <AnimatePresence>
              {showTaglineHint && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl bg-anime-dark border border-anime-border shadow-2xl z-50"
                >
                  <p className="text-[10px] uppercase tracking-wide text-gray-600 mb-1 font-medium">
                    Tagline Hint
                  </p>
                  <p className="text-xs italic text-gray-300 leading-relaxed">
                    &ldquo;{target.tagline}&rdquo;
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Synopsis hint after 5 wrong guesses */}
      <AnimatePresence>
        {showSynopsisHint && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="border-anime-yellow/30 bg-anime-yellow/5">
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-anime-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-anime-yellow mb-1">Synopsis Hint</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{target.synopsis}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Give Up button */}
      {!gameOver && (
        <button
          onClick={handleGiveUp}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-anime-card border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/70 transition-colors font-medium text-sm"
        >
          <Flag className="w-4 h-4" />
          Give Up
        </button>
      )}

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
            className={`relative overflow-hidden p-4 rounded-xl border ${
              won ? "bg-anime-green/10 border-anime-green/40" : "bg-red-500/10 border-red-500/40"
            }`}
          >
            <p className={`text-lg font-bold mb-3 ${won ? "text-anime-green" : "text-red-400"}`}>
              {won
                ? `🎉 Correct in ${guesses.length} guess${guesses.length !== 1 ? "es" : ""}!`
                : gaveUp
                ? `🏳️ You gave up! The answer was \u201c${target.title}\u201d`
                : `😞 The answer was \u201c${target.title}\u201d`}
            </p>

            <PosterReveal movie={target} won={won} />

            <button
              onClick={reset}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-anime-pink/15 hover:bg-anime-pink/25 border border-anime-pink/40 text-anime-pink font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
            
            {/* Share button */}
            <button
              onClick={handleShare}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-anime-card hover:bg-anime-border border border-anime-border text-gray-300 text-sm font-semibold transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Result
            </button>

            {/* Copied toast */}
            <AnimatePresence>
              {copied && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-center text-xs text-anime-green mt-1.5 font-medium"
                >
                  ✓ Copied to clipboard!
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {guesses.length > 0 && (
        <div className="grid grid-cols-[auto_minmax(0,1.5fr)_auto_auto_minmax(0,2fr)_auto] gap-2 px-3 text-xs text-gray-500 font-medium">
          <span className="hidden sm:block w-10"></span>
          <span>Title / Director</span>
          <span className="text-center">Year</span>
          <span className="text-center">IMDb</span>
          <span>Genres</span>
          <span className="text-center">Dir.</span>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {guesses.map((result, i) => (
            <ResultRow key={result.movie.id} result={result} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {guesses.length === 0 && !gameOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-gray-600">
          <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Search and select a movie to make your first guess!</p>
          <p className="text-xs mt-1">You have {MAX_GUESSES} attempts.</p>
        </motion.div>
      )}

    </div>
  );
}
