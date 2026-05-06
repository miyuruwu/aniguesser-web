"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowRight, CheckCircle2, XCircle, Flag, BookOpen } from "lucide-react";
import { Anime, GuessResult } from "@/types/anime";
import { animeData } from "@/data/animeData";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { submitScore } from "@/lib/leaderboard";

function pickRandomTarget(exclude?: number): Anime {
  const pool = exclude !== undefined ? animeData.filter((a) => a.id !== exclude) : animeData;
  return pool[Math.floor(Math.random() * pool.length)];
}

function compareAnime(guess: Anime, target: Anime): GuessResult {
  const yearResult =
    guess.releaseYear < target.releaseYear
      ? "Later"
      : guess.releaseYear > target.releaseYear
      ? "Earlier"
      : "Correct";

  const ratingResult =
    guess.rating < target.rating
      ? "Higher"
      : guess.rating > target.rating
      ? "Lower"
      : "Correct";

  const matchingGenres = guess.genres.filter((g) => target.genres.includes(g));

  const studioResult = guess.studio === target.studio ? "Correct" : "Incorrect";

  return { anime: guess, yearResult, ratingResult, matchingGenres, studioResult };
}

function ResultRow({ result, target }: { result: GuessResult; target: Anime }) {
  const yearVariant =
    result.yearResult === "Correct" ? "correct" : result.yearResult === "Later" ? "later" : "earlier";
  const ratingVariant =
    result.ratingResult === "Correct" ? "correct" : result.ratingResult === "Higher" ? "higher" : "lower";
  const studioVariant = result.studioResult === "Correct" ? "correct" : "incorrect";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="grid grid-cols-[1fr_auto_auto_1fr_auto] gap-2 items-center p-3 rounded-lg bg-anime-card border border-anime-border"
    >
      {/* Title */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{result.anime.title}</p>
        <p className="text-xs text-gray-400">{result.anime.studio}</p>
      </div>

      {/* Year */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Year</p>
        <Badge variant={yearVariant}>
          {result.yearResult === "Correct" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : result.yearResult === "Earlier" ? (
            "↑ Earlier"
          ) : (
            "↓ Later"
          )}
          {result.yearResult === "Correct" && " ✓"}
          {result.yearResult !== "Correct" && ` ${result.anime.releaseYear}`}
        </Badge>
      </div>

      {/* Rating */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Rating</p>
        <Badge variant={ratingVariant}>
          {result.ratingResult === "Correct"
            ? "✓ Correct"
            : result.ratingResult === "Higher"
            ? `↑ Higher (${result.anime.rating})`
            : `↓ Lower (${result.anime.rating})`}
        </Badge>
      </div>

      {/* Genres */}
      <div>
        <p className="text-xs text-gray-500 mb-0.5">Genres</p>
        <div className="flex flex-wrap gap-1">
          {result.anime.genres.map((g) => (
            <Badge
              key={g}
              variant={result.matchingGenres.includes(g) ? "match" : "neutral"}
            >
              {g}
            </Badge>
          ))}
        </div>
      </div>

      {/* Studio */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Studio</p>
        <Badge variant={studioVariant}>
          {result.studioResult === "Correct" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          {result.studioResult}
        </Badge>
      </div>
    </motion.div>
  );
}

export default function AnimeWordle() {
  const [target, setTarget] = useState<Anime>(() => pickRandomTarget());
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [won, setWon] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const maxGuesses = 8;
  const SYNOPSIS_HINT_THRESHOLD = 5;
  const scoreSubmittedRef = useRef(false);

  const { user, loading: authLoading } = useAuth();

  // Count wrong guesses (all guesses are wrong until you guess correctly)
  const wrongGuesses = guesses.length;
  const showSynopsisHint = !won && !gaveUp && wrongGuesses >= SYNOPSIS_HINT_THRESHOLD && !!target.synopsis;

  const handleGuess = useCallback(
    (anime: Anime) => {
      if (won || gaveUp || guesses.length >= maxGuesses) return;

      // Prevent duplicate guesses
      if (guesses.some((g) => g.anime.id === anime.id)) {
        setInputValue("");
        return;
      }

      const result = compareAnime(anime, target);
      const newGuesses = [...guesses, result];
      setGuesses(newGuesses);
      setInputValue("");

      if (anime.id === target.id || anime.title === target.title) {
        setWon(true);
        setTotalScore(s => s + (maxGuesses - guesses.length) * 10);
      }
    },
    [guesses, target, won, gaveUp]
  );

  const handleGiveUp = () => {
    if (won || gaveUp || guesses.length >= maxGuesses) return;
    setGaveUp(true);
  };

  const handleReset = () => {
    setTarget(pickRandomTarget(target.id));
    setGuesses([]);
    setWon(false);
    setGaveUp(false);
    setInputValue("");
    scoreSubmittedRef.current = false;
  };

  // Save score when game ends (win/lose/give up) — submit only once per round
  useEffect(() => {
    const gameEnded = won || gaveUp || guesses.length >= maxGuesses;
    // Wait until the session check finishes before deciding whether to submit.
    // Without this guard, user===null while loading causes the score to be skipped.
    if (gameEnded && !authLoading && user && totalScore > 0 && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      submitScore("wordle", user.id, user.username, totalScore);
    }
  }, [won, gaveUp, guesses.length, user, authLoading, totalScore]);

  const failed = !won && !gaveUp && guesses.length >= maxGuesses;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-8">
        <h2 className="text-6xl font-nabla tracking-[0.2em] text-white brightness-0 invert uppercase">
          Anime Wordle
        </h2>
        <p className="text-gray-400 text-sm font-sans tracking-wide">
          Guess the anime in {maxGuesses} tries. Each guess reveals clues.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="w-full relative flex items-end justify-between px-2 font-sans py-4 pb-2 border-white/10">
        <div className="flex flex-col items-start">
          <span className="text-white text-lg font-semibold tracking-wide">
            Guesses: <span className={guesses.length >= maxGuesses - 2 ? "text-red-400" : "text-white"}>
              {guesses.length}/{maxGuesses}
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
            onClick={handleReset}
            className="text-white text-lg font-semibold tracking-wide hover:text-gray-300 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Win/Lose/Give Up Banner */}
      <AnimatePresence>
        {(won || failed || gaveUp) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card glow={won ? "accent" : "none"} className={won ? "border-anime-green/50" : "border-red-500/50"}>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {target.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={target.imageUrl}
                    alt={target.title}
                    className="w-16 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="text-center sm:text-left">
                  {won ? (
                    <>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <Trophy className="w-5 h-5 text-anime-yellow" />
                        <p className="text-lg font-bold text-anime-green">You got it!</p>
                      </div>
                      <p className="text-gray-300">
                        <span className="text-white font-semibold">{target.title}</span> in{" "}
                        {guesses.length} guess{guesses.length !== 1 ? "es" : ""}
                      </p>
                    </>
                  ) : gaveUp ? (
                    <>
                      <p className="text-lg font-bold text-red-400">You gave up!</p>
                      <p className="text-gray-300">
                        The answer was{" "}
                        <span className="text-white font-semibold">{target.title}</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-red-400">Better luck next time!</p>
                      <p className="text-gray-300">
                        The answer was{" "}
                        <span className="text-white font-semibold">{target.title}</span>
                      </p>
                    </>
                  )}
                  {target.synopsis && (
                    <p className="text-gray-400 text-xs mt-1 max-w-sm">{target.synopsis.slice(0, 120)}…</p>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-anime-accent text-white hover:bg-anime-accent/80 transition-colors font-medium"
                >
                  <ArrowRight className="w-4 h-4" />
                  Play Again
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Input + Give Up */}
      {!won && !failed && !gaveUp && (
        <div className="flex gap-2">
          <AutocompleteInput
            placeholder="Type an anime name to guess..."
            onSelect={handleGuess}
            value={inputValue}
            onChange={setInputValue}
          />
          <button
            onClick={handleGiveUp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-anime-card border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/70 transition-colors font-medium text-sm flex-shrink-0"
            title="Give up and reveal the answer"
          >
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Give Up</span>
          </button>
        </div>
      )}

      {/* Column Headers */}
      {guesses.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto_1fr_auto] gap-2 px-3 text-xs text-gray-500 font-medium">
          <span>Anime</span>
          <span className="text-center">Year</span>
          <span className="text-center">Rating</span>
          <span>Genres</span>
          <span className="text-center">Studio</span>
        </div>
      )}

      {/* Guess Rows */}
      <div className="space-y-2">
        {guesses.map((result, i) => (
          <ResultRow key={i} result={result} target={target} />
        ))}
      </div>

      {/* Legend */}
      <Card className="mt-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">How to read clues</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Badge variant="correct">✓ Correct</Badge>
            <span>Exact match</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="earlier">↑ Earlier</Badge>
            <span>Guess &gt; Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="later">↓ Later</Badge>
            <span>Guess &lt; Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="higher">↑ Higher</Badge>
            <span>Rating too low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="lower">↓ Lower</Badge>
            <span>Rating too high</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="match">Genre</Badge>
            <span>Shared genre</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
