"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Github } from "lucide-react";
import { GameMode } from "@/types/anime";
import Navigation from "@/components/Navigation";
import AnimeWordle from "@/components/modes/AnimeWordle";
import ScreenshotGuesser from "@/components/modes/ScreenshotGuesser";
import CharacterGuesser from "@/components/modes/CharacterGuesser";

const modeComponents: Record<GameMode, React.ReactNode> = {
  wordle: <AnimeWordle />,
  screenshot: <ScreenshotGuesser />,
  character: <CharacterGuesser />,
};

const modeTitles: Record<GameMode, string> = {
  wordle: "Anime Wordle",
  screenshot: "Screenshot Guesser",
  character: "Character & Series Guesser",
};

export default function HomePage() {
  const [activeMode, setActiveMode] = useState<GameMode>("wordle");

  return (
    <div className="min-h-screen bg-anime-darker">
      {/* Hero Header */}
      <header className="border-b border-anime-border bg-anime-dark/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-anime-accent/20 border border-anime-accent/40 flex items-center justify-center">
              <Sword className="w-4 h-4 text-anime-accent" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">AniGuesser</h1>
              <p className="text-xs text-gray-500 leading-none">Anime Knowledge Games</p>
            </div>
          </div>
          <a
            href="https://github.com/miyuruwu/aniguesser-web"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-anime-card border border-transparent hover:border-anime-border transition-all"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Navigation */}
        <Navigation activeMode={activeMode} onModeChange={setActiveMode} />

        {/* Mode Title */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={activeMode + "-title"}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="text-center text-lg font-semibold text-gray-300"
          >
            {modeTitles[activeMode]}
          </motion.h2>
        </AnimatePresence>

        {/* Game Mode Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {modeComponents[activeMode]}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-6 text-center text-gray-600 text-xs">
        <p>
          Powered by{" "}
          <a
            href="https://jikan.moe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-anime-accent hover:underline"
          >
            Jikan API
          </a>{" "}
          (Unofficial MyAnimeList API)
        </p>
        <p className="mt-0.5">AniGuesser – Built with Next.js, Tailwind CSS &amp; Framer Motion</p>
      </footer>
    </div>
  );
}
