import { GameScoreEntry } from "@/types/anime";

export interface LeaderboardData {
  wordle: GameScoreEntry[];
  screenshot: GameScoreEntry[];
  movie: GameScoreEntry[];
}

export type LeaderboardMode = keyof LeaderboardData;

const EMPTY: LeaderboardData = { wordle: [], screenshot: [], movie: [] };

export async function getLeaderboard(): Promise<LeaderboardData> {
  try {
    const res = await fetch("/api/leaderboard", { cache: "no-store" });
    if (!res.ok) return EMPTY;
    return (await res.json()) as LeaderboardData;
  } catch {
    return EMPTY;
  }
}

export async function submitScore(
  mode: LeaderboardMode,
  userId: string,
  username: string,
  score: number
): Promise<void> {
  if (score <= 0) return;
  try {
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // send the session cookie so the server can auth us
      body: JSON.stringify({ mode, score }),
    });
  } catch {
    // Fire-and-forget; silently ignore network failures
  }
}
