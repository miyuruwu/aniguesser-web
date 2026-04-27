"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkipForward, ChevronRight, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { Anime } from "@/types/anime";
import { animeData } from "@/data/animeData";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function pickRandom(exclude?: number): Anime {
  const pool = exclude !== undefined ? animeData.filter((a) => a.id !== exclude) : animeData;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function ScreenshotGuesser() {
  const [current, setCurrent] = useState<Anime>(() => pickRandom());
  const [streak, setStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [guessed, setGuessed] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleSelect = useCallback(
    (anime: Anime) => {
      if (guessed) return;
      const correct =
        anime.id === current.id ||
        anime.title.toLowerCase() === current.title.toLowerCase();

      setFeedback(correct ? "correct" : "wrong");
      setGuessed(true);

      if (correct) {
        setStreak((s) => s + 1);
        setTotalScore((s) => s + 10);
      } else {
        setStreak(0);
      }
      setInputValue(anime.title);
    },
    [current, guessed]
  );

  const handleNext = () => {
    setCurrent(pickRandom(current.id));
    setFeedback(null);
    setGuessed(false);
    setInputValue("");
  };

  const handleSkip = () => {
    setCurrent(pickRandom(current.id));
    setFeedback(null);
    setGuessed(false);
    setInputValue("");
    setStreak(0);
  };

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

      {/* Image Card */}
      <Card glow="cyan" className="overflow-hidden p-0">
        <div className="relative aspect-[16/9] bg-anime-darker flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.screenshotUrl}
            alt="Guess this anime"
            className={`w-full h-full object-cover transition-all duration-300 ${
              !guessed ? "blur-sm scale-105" : ""
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/640x360/13132a/6c63ff?text=Anime+Screenshot";
            }}
          />
          {!guessed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/60 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
                🔍 Guess the anime!
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Feedback Banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className={feedback === "correct" ? "border-anime-green/50" : "border-red-500/50"}>
              <div className="flex items-center gap-3">
                {feedback === "correct" ? (
                  <CheckCircle2 className="w-5 h-5 text-anime-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={feedback === "correct" ? "font-semibold text-anime-green" : "font-semibold text-red-400"}>
                    {feedback === "correct" ? "Correct! +10 points" : "Not quite!"}
                  </p>
                  {feedback === "wrong" && (
                    <p className="text-sm text-gray-300">
                      The answer was <span className="text-white font-semibold">{current.title}</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge variant={feedback === "correct" ? "correct" : "incorrect"}>
                    {current.releaseYear}
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <AutocompleteInput
        placeholder="Type anime name..."
        onSelect={handleSelect}
        disabled={guessed}
        value={inputValue}
        onChange={setInputValue}
      />

      {/* Controls */}
      <div className="flex gap-3">
        {guessed ? (
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-anime-accent text-white font-semibold hover:bg-anime-accent/80 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            Next Anime
          </button>
        ) : (
          <button
            onClick={handleSkip}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-anime-card border border-anime-border text-gray-400 hover:text-white hover:border-anime-accent transition-colors font-medium"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </button>
        )}
      </div>

      {/* Anime info revealed after guess */}
      <AnimatePresence>
        {guessed && (
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
