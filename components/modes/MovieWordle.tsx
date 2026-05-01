"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Trophy,
  Film,
  Search,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Movie, MovieGuessResult } from "@/types/movie";
import { movieData } from "@/data/movieData";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const MAX_GUESSES = 8;

// ─── Pure helper functions ───────────────────────────────────────────────────

function pickRandom(exclude?: number): Movie {
  const pool =
    exclude !== undefined ? movieData.filter((m) => m.id !== exclude) : movieData;
  return pool[Math.floor(Math.random() * pool.length)];
}

function compareMovies(guess: Movie, target: Movie): MovieGuessResult {
  const yearResult: MovieGuessResult["yearResult"] =
    guess.releaseYear > target.releaseYear
      ? "Earlier"
      : guess.releaseYear < target.releaseYear
      ? "Later"
      : "Correct";

  const ratingResult: MovieGuessResult["ratingResult"] =
    guess.rating > target.rating
      ? "Lower"
      : guess.rating < target.rating
      ? "Higher"
      : "Correct";

  const matchingGenres = guess.genres.filter((g) => target.genres.includes(g));

  const directorResult: MovieGuessResult["directorResult"] =
    guess.director.trim().toLowerCase() === target.director.trim().toLowerCase()
      ? "Correct"
      : "Incorrect";

  return { movie: guess, yearResult, ratingResult, matchingGenres, directorResult };
}

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

// ─── Sub-component: ResultRow ────────────────────────────────────────────────

function ResultRow({
  result,
  target,
  index,
}: {
  result: MovieGuessResult;
  target: Movie;
  index: number;
}) {
  const yearVariant =
    result.yearResult === "Correct"
      ? "correct"
      : result.yearResult === "Earlier"
      ? "earlier"
      : "later";

  const ratingVariant =
    result.ratingResult === "Correct"
      ? "correct"
      : result.ratingResult === "Higher"
      ? "higher"
      : "lower";

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="grid grid-cols-[1fr_auto_auto_1fr_auto] gap-2 items-center p-3 rounded-lg bg-anime-card border border-anime-border"
    >
      {/* Col 1: Title + Director */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{result.movie.title}</p>
        <p className="text-xs text-gray-400">{result.movie.director}</p>
      </div>

      {/* Col 2: Year */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Year</p>
        <Badge variant={yearVariant}>
          {result.yearResult === "Correct" ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              {result.movie.releaseYear}
            </>
          ) : result.yearResult === "Earlier" ? (
            <>
              <ChevronUp className="w-3 h-3" />
              {result.movie.releaseYear}
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              {result.movie.releaseYear}
            </>
          )}
        </Badge>
      </div>

      {/* Col 3: IMDb */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">IMDb</p>
        <Badge variant={ratingVariant}>
          {result.ratingResult === "Correct"
            ? `✓ ${result.movie.rating}`
            : result.ratingResult === "Higher"
            ? `↑ ${result.movie.rating}`
            : `↓ ${result.movie.rating}`}
        </Badge>
      </div>

      {/* Col 4: Genres */}
      <div>
        <p className="text-xs text-gray-500 mb-0.5">Genres</p>
        <div className="flex flex-wrap gap-1">
          {result.movie.genres.map((g) => (
            <Badge
              key={g}
              variant={result.matchingGenres.includes(g) ? "match" : "neutral"}
            >
              {g}
            </Badge>
          ))}
        </div>
      </div>

      {/* Col 5: Director */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Dir.</p>
        <Badge variant={result.directorResult === "Correct" ? "correct" : "incorrect"}>
          {result.directorResult === "Correct" ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              {target.director === result.movie.director ? "✓" : "✓"}
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
            </>
          )}
        </Badge>
      </div>
    </motion.div>
  );
}

// ─── Sub-component: PosterReveal ─────────────────────────────────────────────

function PosterReveal({ movie, won }: { movie: Movie; won: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex flex-col sm:flex-row gap-5 items-start"
    >
      {/* Poster image */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-32 h-48 rounded-xl overflow-hidden border-2 ${
            won ? "border-anime-green/60" : "border-red-500/60"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/128x192/13132a/6c63ff?text=%F0%9F%8E%AC";
            }}
          />
        </div>
        {won && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="absolute -top-3 -right-3 w-8 h-8 bg-anime-yellow/20 border border-anime-yellow/50 rounded-full flex items-center justify-center"
          >
            <Trophy className="w-4 h-4 text-anime-yellow" />
          </motion.div>
        )}
      </div>

      {/* Movie info */}
      <div className="flex-1 min-w-0">
        <p className="text-xl font-bold text-white">{movie.title}</p>
        <p className="text-sm italic text-anime-pink mt-0.5">{movie.tagline}</p>

        <div className="flex flex-wrap gap-1 mt-2">
          {movie.genres.map((g) => (
            <Badge key={g} variant="neutral">
              {g}
            </Badge>
          ))}
        </div>

        <div className="mt-2 space-y-0.5 text-xs text-gray-400">
          <p>
            <span className="text-gray-500">Director:</span> {movie.director}
          </p>
          <p>
            <span className="text-gray-500">Year:</span> {movie.releaseYear}
          </p>
          <p>
            <span className="text-gray-500">IMDb:</span>{" "}
            <span className="text-anime-yellow font-semibold">⭐ {movie.rating}</span>
          </p>
        </div>

        <p className="text-xs text-gray-400 mt-2 line-clamp-3">{movie.synopsis}</p>
      </div>
    </motion.div>
  );
}

// ─── Sub-component: MovieAutocompleteInput ───────────────────────────────────

interface MovieAutocompleteInputProps {
  onSelect: (movie: Movie) => void;
  disabled: boolean;
  guessedIds: Set<number>;
}

function MovieAutocompleteInput({
  onSelect,
  disabled,
  guessedIds,
}: MovieAutocompleteInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (query.trim().length < 1) return [];
    return movieData.filter(
      (m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) && !guessedIds.has(m.id)
    );
  }, [query, guessedIds]);

  const handleSelect = (movie: Movie) => {
    onSelect(movie);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search for a movie..."
          disabled={disabled}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-anime-card border border-anime-border text-white placeholder-gray-600 focus:outline-none focus:border-anime-pink/60 transition-colors disabled:opacity-50"
        />
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-xl bg-anime-card border border-anime-border shadow-lg"
          >
            {filtered.map((movie) => (
              <li key={movie.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(movie)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-anime-border/50 transition-colors"
                >
                  <Film className="w-4 h-4 text-anime-pink flex-shrink-0" />
                  <span className="flex-1 text-sm text-white truncate">{movie.title}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {movie.releaseYear}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component: MovieWordle ─────────────────────────────────────────────

export default function MovieWordle() {
  const [target, setTarget] = useState<Movie>(() => pickRandom());
  const [guesses, setGuesses] = useState<MovieGuessResult[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const guessedIds = useMemo(
    () => new Set(guesses.map((g) => g.movie.id)),
    [guesses]
  );

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
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
      }
    },
    [guesses, target, gameOver, guessedIds]
  );

  const reset = () => {
    setTarget(pickRandom(target.id));
    setGuesses([]);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Card */}
      <Card glow="none">
        <div className="flex items-center justify-between gap-3">
          {/* Left: icon + title + remaining */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-anime-pink/20 border border-anime-pink/40 flex items-center justify-center flex-shrink-0">
              <Film className="w-4 h-4 text-anime-pink" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-none">Movie Wordle</p>
              <p className="text-xs text-gray-500 leading-none mt-0.5">
                {gameOver
                  ? won
                    ? "You got it!"
                    : "Game over"
                  : `${remaining} guess${remaining !== 1 ? "es" : ""} left`}
              </p>
            </div>
          </div>

          {/* Center: 8 pip dots */}
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_GUESSES }).map((_, i) => {
              const isGuessed = i < guesses.length;
              const isLastGuess = i === guesses.length - 1;
              let dotClass = "w-2 h-2 rounded-full ";
              if (gameOver && isLastGuess && won) {
                dotClass += "bg-anime-green";
              } else if (gameOver && i === MAX_GUESSES - 1 && !won && guesses.length >= MAX_GUESSES) {
                dotClass += "bg-red-500";
              } else if (isGuessed) {
                dotClass += "bg-anime-accent/70";
              } else {
                dotClass += "bg-anime-border";
              }
              return <span key={i} className={dotClass} />;
            })}
          </div>

          {/* Right: reset button */}
          <button
            onClick={reset}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-anime-card border border-transparent hover:border-anime-border transition-all flex-shrink-0"
            title="New game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* 2. Hint legend */}
      <div className="flex flex-wrap gap-1.5 text-xs text-gray-500 items-center">
        <span>Hints:</span>
        <Badge variant="correct">✓ Correct</Badge>
        <Badge variant="earlier">↑ Earlier</Badge>
        <Badge variant="later">↓ Later</Badge>
        <Badge variant="higher">↑ Higher</Badge>
        <Badge variant="lower">↓ Lower</Badge>
        <Badge variant="match">Genre Match</Badge>
      </div>

      {/* 3. Input (only when !gameOver) */}
      {!gameOver && (
        <MovieAutocompleteInput
          onSelect={handleGuess}
          disabled={gameOver}
          guessedIds={guessedIds}
        />
      )}

      {/* 4. Win/Lose banner */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-xl border ${
              won
                ? "bg-anime-green/10 border-anime-green/40"
                : "bg-red-500/10 border-red-500/40"
            }`}
          >
            {/* Status message */}
            <p
              className={`text-lg font-bold mb-3 ${
                won ? "text-anime-green" : "text-red-400"
              }`}
            >
              {won
                ? `🎉 Correct in ${guesses.length} guess${guesses.length !== 1 ? "es" : ""}!`
                : `😞 The answer was \u201c${target.title}\u201d`}
            </p>

            {/* PosterReveal */}
            <PosterReveal movie={target} won={won} />

            {/* Play Again button */}
            <button
              onClick={reset}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-anime-accent text-white hover:bg-anime-accent/80 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Column headers (only when guesses.length > 0) */}
      {guesses.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto_1fr_auto] gap-2 px-3 text-xs text-gray-500 font-medium">
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
            <ResultRow
              key={result.movie.id}
              result={result}
              target={target}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 7. Empty state */}
      {guesses.length === 0 && !gameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 text-gray-600"
        >
          <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Search and select a movie to make your first guess!</p>
          <p className="text-xs mt-1">You have {MAX_GUESSES} attempts.</p>
        </motion.div>
      )}
    </div>
  );
}
