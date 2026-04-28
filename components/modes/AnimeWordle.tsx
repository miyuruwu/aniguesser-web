"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, ArrowRight, CheckCircle2, XCircle, Flag, Lock, BookOpen } from "lucide-react";
import { Anime, GuessResult } from "@/types/anime";
import { animeData } from "@/data/animeData";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { getFranchiseKey, pickRandomTarget as pickRandom, MAX_GUESSES, CLUE_UNLOCK_AT } from "@/lib/gameUtils";

function pickRandomTarget(exclude?: number): Anime {
  return pickRandom(animeData, exclude);
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
  const [won, setWon] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleGuess = useCallback(
    (anime: Anime) => {
      if (won || gaveUp || guesses.length >= MAX_GUESSES) return;

      // Prevent duplicate guesses
      if (guesses.some((g) => g.anime.id === anime.id)) {
        setInputValue("");
        return;
      }

      const result = compareAnime(anime, target);
      const newGuesses = [...guesses, result];
      setGuesses(newGuesses);
      setInputValue("");

      // A guess counts as correct if it matches the same franchise as the target
      if (
        anime.id === target.id ||
        getFranchiseKey(anime.title) === getFranchiseKey(target.title)
      ) {
        setWon(true);
      }
    },
    [guesses, target, won, gaveUp]
  );

  const handleGiveUp = useCallback(() => {
    if (won || gaveUp || guesses.length >= MAX_GUESSES) return;
    setGaveUp(true);
  }, [won, gaveUp, guesses.length]);

  const handleReset = () => {
    setTarget(pickRandomTarget(target.id));
    setGuesses([]);
    setWon(false);
    setGaveUp(false);
    setInputValue("");
  };

  const failed = !won && (guesses.length >= MAX_GUESSES || gaveUp);
  const clueUnlocked = guesses.length >= CLUE_UNLOCK_AT || won || failed;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Anime Wordle</h2>
        <p className="text-gray-400 text-sm">
          Guess the anime in {MAX_GUESSES} tries. Each guess reveals clues.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-gray-400">
            Guesses:{" "}
            <span className={guesses.length >= MAX_GUESSES - 2 ? "text-red-400" : "text-white"}>
              {guesses.length}/{MAX_GUESSES}
            </span>
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-anime-card border border-anime-border text-gray-400 hover:text-white hover:border-anime-accent transition-colors text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Game
          </button>
        </div>
      </div>

      {/* Win/Lose Banner */}
      <AnimatePresence>
        {(won || failed) && (
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
                      <p className="text-lg font-bold text-orange-400">You gave up!</p>
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

      {/* Input + Give Up */}
      {!won && !failed && (
        <div className="flex gap-2">
          <AutocompleteInput
            placeholder="Type an anime name to guess..."
            onSelect={handleGuess}
            value={inputValue}
            onChange={setInputValue}
          />
          <button
            onClick={handleGiveUp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-anime-card border border-anime-border text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-colors text-sm whitespace-nowrap"
          >
            <Flag className="w-3.5 h-3.5" />
            Give Up
          </button>
        </div>
      )}

      {/* Synopsis Clue */}
      <Card className={clueUnlocked ? "" : "opacity-80"}>
        <div className="flex items-center gap-2 mb-2">
          {clueUnlocked ? (
            <BookOpen className="w-4 h-4 text-anime-accent" />
          ) : (
            <Lock className="w-4 h-4 text-gray-600" />
          )}
          <p className="text-sm font-semibold text-gray-300">Synopsis Clue</p>
          {!clueUnlocked && (
            <span className="text-xs text-gray-500 ml-auto">
              Unlocks at {CLUE_UNLOCK_AT} guesses ({CLUE_UNLOCK_AT - guesses.length} more needed)
            </span>
          )}
        </div>
        {clueUnlocked ? (
          <p className="text-sm text-gray-300">{target.synopsis ?? "No synopsis available."}</p>
        ) : (
          <div className="flex items-center justify-center py-3">
            {(() => {
              const remaining = CLUE_UNLOCK_AT - guesses.length;
              return (
                <span className="text-xs text-gray-600 italic">
                  Make {remaining} more guess{remaining !== 1 ? "es" : ""} to reveal the synopsis…
                </span>
              );
            })()}
          </div>
        )}
      </Card>

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
