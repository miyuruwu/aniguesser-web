"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, XCircle, Trophy, Palette, Flag, BookOpen } from "lucide-react";
import { Anime } from "@/types/anime";
import { animeData } from "@/data/animeData";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { submitScore } from "@/lib/leaderboard";

// --- Scoring constants ---
// Base score per correct answer; reduced by POINTS_PER_WRONG for every wrong
// guess so the player is incentivised to guess early. Choosing to reveal color
// multiplies the final score by COLOR_MULTIPLIER (a 30% penalty).
const BASE_POINTS = 100;
const POINTS_PER_WRONG = 15;
const COLOR_MULTIPLIER = 0.7;
// Number of wrong guesses allowed before the image is fully revealed.
const MAX_ATTEMPTS = 5;

// Blur (px) per attempt count: index = number of wrong guesses so far
const BLUR_STEPS = [24, 18, 12, 6, 2, 0] as const;

function pickRandom(exclude?: number): Anime {
  const pool = exclude !== undefined ? animeData.filter((a) => a.id !== exclude) : animeData;
  return pool[Math.floor(Math.random() * pool.length)];
}

function calcPoints(wrongGuesses: number, colorOpened: boolean): number {
  const raw = Math.max(0, BASE_POINTS - wrongGuesses * POINTS_PER_WRONG);
  return colorOpened ? Math.round(raw * COLOR_MULTIPLIER) : raw;
}

export default function ScreenshotGuesser() {
  const [current, setCurrent] = useState<Anime>(() => pickRandom());
  const [streak, setStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [colorOpened, setColorOpened] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [won, setWon] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");

  const { user } = useAuth();

  const blurPx = BLUR_STEPS[Math.min(wrongGuesses, BLUR_STEPS.length - 1)];
  const imageFilter = `blur(${blurPx}px)${colorOpened ? "" : " grayscale(100%)"}`;

  // Synopsis hint appears when player is struggling (3+ wrong guesses) and game is still active
  const SYNOPSIS_HINT_THRESHOLD = 3;
  const showSynopsisHint = !revealed && wrongGuesses >= SYNOPSIS_HINT_THRESHOLD && !!current.synopsis;

  const handleSelect = useCallback(
    (anime: Anime) => {
      if (revealed) return;
      const correct =
        anime.id === current.id ||
        anime.title.toLowerCase() === current.title.toLowerCase();

      if (correct) {
        const pts = calcPoints(wrongGuesses, colorOpened);
        setEarnedPoints(pts);
        setTotalScore((s) => s + pts);
        setStreak((s) => s + 1);
        setWon(true);
        setRevealed(true);
      } else {
        const newWrong = wrongGuesses + 1;
        setWrongGuesses(newWrong);
        if (newWrong >= MAX_ATTEMPTS) {
          setEarnedPoints(0);
          setRevealed(true);
          setStreak(0);
        }
      }
      setInputValue("");
    },
    [current, revealed, wrongGuesses, colorOpened]
  );

  const handleGiveUp = () => {
    if (revealed) return;
    setEarnedPoints(0);
    setGaveUp(true);
    setRevealed(true);
    setStreak(0);
  };

  const handleOpenColor = () => {
    if (!colorOpened && !revealed) {
      setColorOpened(true);
    }
  };

  const handleNext = () => {
    setCurrent(pickRandom(current.id));
    setWrongGuesses(0);
    setColorOpened(false);
    setRevealed(false);
    setWon(false);
    setGaveUp(false);
    setEarnedPoints(null);
    setInputValue("");
  };

  // Save score when a round ends with points earned
  useEffect(() => {
    if (revealed && user && totalScore > 0) {
      submitScore("screenshot", user.id, user.username, totalScore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  const attemptsLeft = MAX_ATTEMPTS - wrongGuesses;
  const potentialPoints = calcPoints(wrongGuesses, colorOpened);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-8">
        <h2 className="text-6xl font-nabla tracking-[0.2em] text-white brightness-0 invert uppercase">
          Screenshot Guess
        </h2>
        <p className="text-gray-400 text-sm font-sans tracking-wide">
          Identify the anime from its cover art
        </p>
      </div>

      {/* Round status and Score Bar */}
      <div className="w-full relative flex items-end justify-between px-2 font-sans py-4 pb-2">
        <div className="flex flex-col items-start">
          <span className="text-white text-lg font-semibold tracking-wide">
            Worth: <span className="opacity-100">{potentialPoints}</span>
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
          <span className="text-white text-lg font-semibold tracking-wide">
            Attempts: {attemptsLeft}
          </span>
        </div>
      </div>

      {/* Image Card */}
      <Card glow="cyan" className="overflow-hidden p-0">
        <div className="relative aspect-[16/9] bg-anime-darker flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.screenshotUrl}
            alt="Guess this anime"
            style={{ filter: revealed ? "none" : imageFilter }}
            className={`w-full h-full object-cover transition-all duration-500 ${!revealed ? "scale-110" : ""
              }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/640x360/13132a/6c63ff?text=Anime+Screenshot";
            }}
          />
          {!revealed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/60 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
                🔍 Guess the anime!
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Color & Give Up controls */}
      {!revealed && (
        <div className="flex gap-3">
          <button
            onClick={handleOpenColor}
            disabled={colorOpened}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-colors text-sm ${colorOpened
              ? "bg-anime-card border-yellow-500/40 text-anime-yellow opacity-60 cursor-not-allowed"
              : "bg-anime-card border-anime-border text-gray-400 hover:text-anime-yellow hover:border-yellow-500/60"
              }`}
          >
            <Palette className="w-4 h-4" />
            {colorOpened ? "Color opened" : `Open color (×${COLOR_MULTIPLIER} pts)`}
          </button>

          <button
            onClick={handleGiveUp}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-anime-card border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/70 transition-colors font-medium text-sm"
          >
            <Flag className="w-4 h-4" />
            Give up
          </button>
        </div>
      )}

      {/* Synopsis hint after 3 wrong guesses */}
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
                  <p className="text-xs text-gray-300 leading-relaxed">{current.synopsis}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Banner */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className={won ? "border-anime-green/50" : "border-red-500/50"}>
              <div className="flex items-center gap-3">
                {won ? (
                  <CheckCircle2 className="w-5 h-5 text-anime-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  {won ? (
                    <p className="font-semibold text-anime-green">
                      Correct! +{earnedPoints} points
                      {wrongGuesses > 0 &&
                        ` (after ${wrongGuesses} wrong guess${wrongGuesses !== 1 ? "es" : ""})`}
                      {colorOpened && " · color penalty applied"}
                    </p>
                  ) : gaveUp ? (
                    <p className="font-semibold text-red-400">You gave up — 0 points</p>
                  ) : (
                    <p className="font-semibold text-red-400">
                      Out of attempts — 0 points
                    </p>
                  )}
                  {!won && (
                    <p className="text-sm text-gray-300">
                      The answer was{" "}
                      <span className="text-white font-semibold">{current.title}</span>
                    </p>
                  )}
                </div>
                <Badge variant={won ? "correct" : "incorrect"}>
                  {current.releaseYear}
                </Badge>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      {!revealed && (
        <AutocompleteInput
          placeholder="Type anime name..."
          onSelect={handleSelect}
          value={inputValue}
          onChange={setInputValue}
        />
      )}

      {/* Next button */}
      {revealed && (
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-anime-accent text-white font-semibold hover:bg-anime-accent/80 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          Next Anime
        </button>
      )}

      {/* Anime info revealed after round */}
      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <div className="flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.imageUrl ?? current.screenshotUrl}
                  alt={current.title}
                  className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="space-y-2 min-w-0">
                  <h3 className="font-bold text-white text-lg">{current.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    {current.genres.map((g) => (
                      <Badge key={g} variant="neutral">{g}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>📅 {current.releaseYear}</span>
                    <span>⭐ {current.rating}</span>
                    <span>🎬 {current.studio}</span>
                  </div>
                  {current.synopsis && (
                    <p className="text-xs text-gray-400 line-clamp-2">{current.synopsis}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

