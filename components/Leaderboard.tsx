"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Camera, Film, Sword, RefreshCw } from "lucide-react";
import { getLeaderboard, LeaderboardData, LeaderboardMode } from "@/lib/leaderboard";
import { GameScoreEntry } from "@/types/anime";

const TABS: { key: LeaderboardMode; label: string; icon: React.ReactNode; color: string }[] = [
  {
    key: "screenshot",
    label: "Screenshot Guess",
    icon: <Camera className="w-4 h-4" />,
    color: "text-anime-cyan",
  },
  {
    key: "wordle",
    label: "Anime Wordle",
    icon: <Sword className="w-4 h-4" />,
    color: "text-anime-accent",
  },
  {
    key: "movie",
    label: "Movie Wordle",
    icon: <Film className="w-4 h-4" />,
    color: "text-anime-pink",
  },
];

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500">
      {rank}
    </span>
  );
}

function LeaderboardTable({ entries }: { entries: GameScoreEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No scores yet!</p>
        <p className="text-xs mt-1">Be the first to claim the top spot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.userId}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.25 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
            i === 0
              ? "bg-anime-yellow/5 border-anime-yellow/30"
              : i === 1
              ? "bg-gray-400/5 border-gray-400/20"
              : i === 2
              ? "bg-orange-500/5 border-orange-500/20"
              : "bg-anime-card border-anime-border"
          }`}
        >
          <div className="w-8 flex items-center justify-center flex-shrink-0">
            <MedalIcon rank={i + 1} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{entry.username}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-lg font-bold text-anime-yellow">{entry.score.toLocaleString()}</span>
            <span className="text-xs text-gray-500 ml-1">pts</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardMode>("screenshot");
  const [data, setData] = useState<LeaderboardData>({
    wordle: [],
    screenshot: [],
    movie: [],
  });

  const refresh = () => setData(getLeaderboard());

  useEffect(() => {
    refresh();
  }, []);

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-6xl font-nabla tracking-[0.2em] text-white brightness-0 invert uppercase">
          Leaderboard
        </h2>
        <p className="text-gray-400 text-sm font-sans tracking-wide">
          Top players across all game modes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-medium text-xs transition-colors ${
              activeTab === tab.key
                ? "bg-anime-card border-anime-accent/50 text-white"
                : "bg-transparent border-anime-border text-gray-500 hover:text-gray-300 hover:border-anime-border/80"
            }`}
          >
            <span className={activeTab === tab.key ? tab.color : ""}>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={refresh}
          className="p-2.5 rounded-xl border border-anime-border text-gray-500 hover:text-white hover:border-anime-border/80 transition-colors flex-shrink-0"
          aria-label="Refresh leaderboard"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Active tab heading */}
      <div className="flex items-center gap-2">
        <span className={activeTabConfig.color}>{activeTabConfig.icon}</span>
        <h3 className="text-sm font-semibold text-white">{activeTabConfig.label}</h3>
        <span className="text-xs text-gray-600 ml-auto">Best scores only</span>
      </div>

      {/* Table */}
      <LeaderboardTable entries={data[activeTab]} />
    </div>
  );
}
