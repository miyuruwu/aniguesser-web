import { GameScoreEntry } from "@/types/anime";

const LEADERBOARD_KEY = "aniguesser-leaderboard";
const MAX_ENTRIES = 20;

export interface LeaderboardData {
  wordle: GameScoreEntry[];
  screenshot: GameScoreEntry[];
  movie: GameScoreEntry[];
}

export type LeaderboardMode = keyof LeaderboardData;

export function getLeaderboard(): LeaderboardData {
  if (typeof window === "undefined") {
    return { wordle: [], screenshot: [], movie: [] };
  }
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw
      ? (JSON.parse(raw) as LeaderboardData)
      : { wordle: [], screenshot: [], movie: [] };
  } catch {
    return { wordle: [], screenshot: [], movie: [] };
  }
}

export function submitScore(
  mode: LeaderboardMode,
  userId: string,
  username: string,
  score: number
): void {
  if (typeof window === "undefined" || score <= 0) return;

  const data = getLeaderboard();
  const entries = data[mode];

  const existingIdx = entries.findIndex((e) => e.userId === userId);
  if (existingIdx >= 0) {
    if (score > entries[existingIdx].score) {
      entries[existingIdx] = { userId, username, score, timestamp: Date.now() };
    }
  } else {
    entries.push({ userId, username, score, timestamp: Date.now() });
  }

  data[mode] = entries.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
}
