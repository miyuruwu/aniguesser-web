import { GameScoreEntry } from "@/types/anime";

export interface LeaderboardData {
  wordle: GameScoreEntry[];
  screenshot: GameScoreEntry[];
  movie: GameScoreEntry[];
}

export type LeaderboardMode = keyof LeaderboardData;

export const LEADERBOARD_UPDATED_EVENT = "leaderboard:updated";

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
): Promise<boolean> {
  if (score <= 0) return false;
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // send the session cookie so the server can auth us
      body: JSON.stringify({ mode, score }),
    });

    if (!res.ok) {
      const message = await res.text();
      console.warn("Leaderboard submit failed:", res.status, message);
      return false;
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(LEADERBOARD_UPDATED_EVENT));
    }

    return true;
  } catch (error) {
    console.warn("Leaderboard submit failed:", error);
    return false;
  }
}
