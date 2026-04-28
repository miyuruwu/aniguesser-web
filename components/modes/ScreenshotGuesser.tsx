"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, XCircle, Trophy, Palette, Flag } from "lucide-react";
import { Anime } from "@/types/anime";
import { animeData } from "@/data/animeData";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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

  const blurPx = BLUR_STEPS[Math.min(wrongGuesses, BLUR_STEPS.length - 1)];
  const imageFilter = `blur(${blurPx}px)${colorOpened ? "" : " grayscale(100%)"}`;

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

  const attemptsLeft = MAX_ATTEMPTS - wrongGuesses;
  const potentialPoints = calcPoints(wrongGuesses, colorOpened);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Screenshot Guesser</h2>
          <p className="text-gray-400 text-sm">Identify the anime from its cover art</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Score</p>
            <p className="text-xl font-bold text-anime-accent">{totalScore}</p>
          </div>
          {streak > 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-500">Streak</p>
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-anime-yellow" />
                <p className="text-xl font-bold text-anime-yellow">{streak}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Round status bar */}
      {!revealed && (
        <Card className="p-3">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400 flex-wrap">
            <span>
              Worth:{" "}
              <span className="text-white font-semibold">{potentialPoints} pts</span>
            </span>
            {colorOpened && (
              <Badge variant="neutral" className="text-anime-yellow border-yellow-500/50">
                🎨 Color opened (×{COLOR_MULTIPLIER})
              </Badge>
            )}
            <span>
              {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left
            </span>
            {/* Attempt dots */}
            <div className="flex gap-1">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < wrongGuesses ? "bg-red-400" : "bg-anime-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Image Card */}
      <Card glow="cyan" className="overflow-hidden p-0">
        <div className="relative aspect-[16/9] bg-anime-darker flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.screenshotUrl}
            alt="Guess this anime"
            style={{ filter: revealed ? "none" : imageFilter }}
            className={`w-full h-full object-cover transition-all duration-500 ${
              !revealed ? "scale-110" : ""
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
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-colors text-sm ${
              colorOpened
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

