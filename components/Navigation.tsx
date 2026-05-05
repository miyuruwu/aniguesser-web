"use client";

import { motion } from "framer-motion";
import { Camera, Hash } from "lucide-react";
import { GameMode } from "@/types/anime";

interface NavigationProps {
  activeMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

const modes: { id: GameMode; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  {
    id: "screenshot",
    label: "Screenshot Guesser",
    icon: <Camera className="w-5 h-5" />,
    description: "Identify anime from cover art",
    color: "text-anime-cyan",
  },
  {
    id: "wordle",
    label: "Anime Wordle",
    icon: <Hash className="w-5 h-5" />,
    description: "Guess anime with clues",
    color: "text-anime-accent",
  },
];

export default function Navigation({ activeMode, onModeChange }: NavigationProps) {
  return (
    <nav className="flex gap-2 sm:gap-3 p-1 glass rounded-xl">
      {modes.map((mode) => {
        const isActive = mode.id === activeMode;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`relative flex-1 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="active-mode-bg"
                className="absolute inset-0 bg-anime-accent/20 border border-anime-accent/40 rounded-lg"
                transition={{ type: "spring", duration: 0.4 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? mode.color : ""}`}>
              {mode.icon}
            </span>
            <span className="relative z-10 hidden sm:block">{mode.label}</span>
            <span className="relative z-10 sm:hidden text-xs leading-tight text-center">
              {mode.label.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
