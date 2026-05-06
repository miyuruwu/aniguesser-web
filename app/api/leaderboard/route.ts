import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

const VALID_MODES = ["wordle", "screenshot", "movie"] as const;
type LeaderboardMode = (typeof VALID_MODES)[number];

const MAX_ENTRIES = 20;

/** GET /api/leaderboard
 *  Returns top-20 scores for all modes (or a single mode via ?mode=...).
 *  Public — no authentication required.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modeParam = searchParams.get("mode") as LeaderboardMode | null;

    if (modeParam && !VALID_MODES.includes(modeParam)) {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    const modes: LeaderboardMode[] = modeParam ? [modeParam] : [...VALID_MODES];

    const result: Record<string, { userId: string; username: string; score: number; timestamp: number }[]> = {};

    for (const mode of modes) {
      const entries = await prisma.leaderboardEntry.findMany({
        where: { mode },
        orderBy: { score: "desc" },
        take: MAX_ENTRIES,
        select: {
          userId: true,
          username: true,
          score: true,
          timestamp: true,
        },
      });

      result[mode] = entries.map((e) => ({
        userId: e.userId,
        username: e.username,
        score: e.score,
        timestamp: e.timestamp.getTime(),
      }));
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/** POST /api/leaderboard
 *  Submit (or improve) the authenticated user's best score for a given mode.
 *  Requires a valid session cookie.
 *  Body: { mode: string, score: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { mode, score } = body as { mode?: string; score?: unknown };

    if (!mode || !VALID_MODES.includes(mode as LeaderboardMode)) {
      return NextResponse.json({ error: "Invalid or missing mode." }, { status: 400 });
    }
    if (typeof score !== "number" || !Number.isFinite(score) || score <= 0) {
      return NextResponse.json({ error: "Score must be a positive number." }, { status: 400 });
    }

    const { userId, username } = session;

    // Upsert: only update if the new score is strictly better
    const existing = await prisma.leaderboardEntry.findUnique({
      where: { userId_mode: { userId, mode } },
    });

    let entry;
    if (!existing) {
      entry = await prisma.leaderboardEntry.create({
        data: { userId, username, mode, score },
      });
    } else if (score > existing.score) {
      entry = await prisma.leaderboardEntry.update({
        where: { userId_mode: { userId, mode } },
        data: { score, username, timestamp: new Date() },
      });
    } else {
      // Score didn't improve, but keep username in sync
      entry =
        existing.username !== username
          ? await prisma.leaderboardEntry.update({
              where: { userId_mode: { userId, mode } },
              data: { username },
            })
          : existing;
    }

    return NextResponse.json({
      entry: {
        userId: entry.userId,
        username: entry.username,
        score: entry.score,
        timestamp: entry.timestamp.getTime(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
