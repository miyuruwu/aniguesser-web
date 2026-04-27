"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Tv, ChevronRight, Trophy, Star } from "lucide-react";
import { Anime } from "@/types/anime";
import { animeData } from "@/data/animeData";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function pickRandom(exclude?: number): Anime {
  const pool = exclude !== undefined ? animeData.filter((a) => a.id !== exclude) : animeData;
  return pool[Math.floor(Math.random() * pool.length)];
}

type RoundState = {
  question: Anime;
  characterGuess: string;
  seriesGuess: string;
  characterCorrect: boolean | null;
  seriesCorrect: boolean | null;
  revealed: boolean;
};

function createRound(excludeId?: number): RoundState {
  return {
    question: pickRandom(excludeId),
    characterGuess: "",
    seriesGuess: "",
    characterCorrect: null,
    seriesCorrect: null,
    revealed: false,
  };
}

export default function CharacterGuesser() {
  const [round, setRound] = useState<RoundState>(() => createRound());
  const [score, setScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  const imageSrc = round.question.characterImageUrl?.trim() ?? "";
  const hasValidImage = imageSrc.length > 0;
  const [imageLoading, setImageLoading] = useState(hasValidImage);

  useEffect(() => {
    setImageLoading(hasValidImage);
  }, [round.question.id, hasValidImage]);

  const handleSubmit = useCallback(() => {
    if (round.revealed) return;

    const charCorrect =
      round.characterGuess.trim().toLowerCase() ===
      round.question.characterName.toLowerCase();
    const seriesCorrect =
      round.seriesGuess.trim().toLowerCase() === round.question.title.toLowerCase();

    const points = charCorrect && seriesCorrect ? 15 : charCorrect || seriesCorrect ? 5 : 0;

    setRound((prev) => ({
      ...prev,
      characterCorrect: charCorrect,
      seriesCorrect,
      revealed: true,
    }));
    setScore((s) => s + points);
    setGamesPlayed((g) => g + 1);
  }, [round]);

  const handleNext = useCallback(() => {
    setRound((prev) => createRound(prev.question.id));
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Character &amp; Series Guesser</h2>
          <p className="text-gray-400 text-sm">
            Identify the character and their anime series
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Score</p>
            <p className="text-xl font-bold text-anime-pink">{score}</p>
          </div>
          {gamesPlayed > 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-500">Played</p>
              <p className="text-xl font-bold text-gray-300">{gamesPlayed}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scoring Info */}
      <Card className="p-3">
        <div className="flex items-center gap-6 justify-center text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-anime-yellow" />
            <span>Both correct: <span className="text-white font-semibold">+15 pts</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-gray-500" />
            <span>One correct: <span className="text-white font-semibold">+5 pts</span></span>
          </div>
        </div>
      </Card>

      {/* Character Image */}
      <Card glow="pink" className="overflow-hidden p-0">
        <div className="relative aspect-square max-h-72 bg-anime-darker flex items-center justify-center">
          {!hasValidImage ? (
            <p className="text-gray-400 text-sm">Image unavailable</p>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={round.question.id}
                src={imageSrc}
                alt="Guess this character"
                className={`w-full h-full object-cover object-top transition-all duration-500 ${
                  !round.revealed ? "blur-md scale-105" : ""
                }`}
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  setImageLoading(false);
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/400x400/13132a/ff6b9d?text=Character";
                }}
              />
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-anime-darker/80">
                  <p className="text-gray-300 text-sm">Loading image...</p>
                </div>
              )}
            </>
          )}
          {!round.revealed && !imageLoading && hasValidImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/70 text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
                👤 Who is this?
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Inputs */}
      {!round.revealed ? (
        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-sm text-gray-400 mb-1.5">
              <User className="w-4 h-4" />
              Character Name
            </label>
            <input
              type="text"
              value={round.characterGuess}
              onChange={(e) =>
                setRound((prev) => ({ ...prev, characterGuess: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Enter character name..."
              className="w-full px-3 py-2.5 rounded-lg bg-anime-card border border-anime-border text-white placeholder-gray-500 focus:outline-none focus:border-anime-pink focus:ring-1 focus:ring-anime-pink transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm text-gray-400 mb-1.5">
              <Tv className="w-4 h-4" />
              Anime Series
            </label>
            <input
              type="text"
              value={round.seriesGuess}
              onChange={(e) =>
                setRound((prev) => ({ ...prev, seriesGuess: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Enter anime series name..."
              className="w-full px-3 py-2.5 rounded-lg bg-anime-card border border-anime-border text-white placeholder-gray-500 focus:outline-none focus:border-anime-pink focus:ring-1 focus:ring-anime-pink transition-colors"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!round.characterGuess.trim() && !round.seriesGuess.trim()}
            className="w-full py-2.5 rounded-lg bg-anime-pink text-white font-semibold hover:bg-anime-pink/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Guesses
          </button>
        </div>
      ) : null}

      {/* Result Reveal */}
      <AnimatePresence>
        {state.revealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Character result */}
            <Card className={state.characterCorrect ? "border-anime-green/50" : "border-red-500/50"}>
              <div className="flex items-center gap-3">
                <User
                  className={`w-5 h-5 flex-shrink-0 ${
                    state.characterCorrect ? "text-anime-green" : "text-red-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Character Name</p>
                  <p className="text-sm">
                    Your guess:{" "}
                    <span
                      className={`font-semibold ${
                        state.characterCorrect ? "text-anime-green" : "text-red-400"
                      }`}
                    >
                      {state.characterGuess || "(no answer)"}
                    </span>
                  </p>
                  {!state.characterCorrect && (
                    <p className="text-sm text-gray-400">
                      Answer: <span className="text-white font-semibold">{current.characterName}</span>
                    </p>
                  )}
                </div>
                <Badge variant={state.characterCorrect ? "correct" : "incorrect"}>
                  {state.characterCorrect ? "✓ Correct" : "✗ Wrong"}
                </Badge>
              </div>
            </Card>

            {/* Series result */}
            <Card className={state.seriesCorrect ? "border-anime-green/50" : "border-red-500/50"}>
              <div className="flex items-center gap-3">
                <Tv
                  className={`w-5 h-5 flex-shrink-0 ${
                    state.seriesCorrect ? "text-anime-green" : "text-red-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Anime Series</p>
                  <p className="text-sm">
                    Your guess:{" "}
                    <span
                      className={`font-semibold ${
                        state.seriesCorrect ? "text-anime-green" : "text-red-400"
                      }`}
                    >
                      {state.seriesGuess || "(no answer)"}
                    </span>
                  </p>
                  {!state.seriesCorrect && (
                    <p className="text-sm text-gray-400">
                      Answer: <span className="text-white font-semibold">{current.title}</span>
                    </p>
                  )}
                </div>
                <Badge variant={state.seriesCorrect ? "correct" : "incorrect"}>
                  {state.seriesCorrect ? "✓ Correct" : "✗ Wrong"}
                </Badge>
              </div>
            </Card>

            {/* Points awarded */}
            <Card className="text-center py-3">
              {state.characterCorrect && state.seriesCorrect ? (
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5 text-anime-yellow" />
                  <p className="text-anime-yellow font-bold text-lg">Perfect! +15 points</p>
                </div>
              ) : state.characterCorrect || state.seriesCorrect ? (
                <p className="text-anime-cyan font-bold text-lg">Half right! +5 points</p>
              ) : (
                <p className="text-gray-400 font-medium">No points this round. Keep trying!</p>
              )}
            </Card>

            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-anime-pink text-white font-semibold hover:bg-anime-pink/80 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              Next Character
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
