import { Anime } from "@/types/anime";

/**
 * Maximum number of guesses allowed per round.
 */
export const MAX_GUESSES = 10;

/**
 * Number of guesses after which the synopsis clue unlocks.
 */
export const CLUE_UNLOCK_AT = 5;

/**
 * Regex that matches common season/part suffixes at the end of an anime title.
 * Examples stripped: "Season 2", "2nd Season", "Final Season", "Part 2".
 */
const SEASON_SUFFIX_RE =
  /\s*(?::?\s*(?:season\s+\d+|\d+(?:st|nd|rd|th)\s+season|final\s+season|part\s+\d+))\s*$/i;

/**
 * Returns a normalised franchise key for the given title by:
 *  1. Stripping trailing season/part suffixes.
 *  2. Lower-casing and trimming whitespace.
 *
 * This allows "Attack on Titan Season 2" and "Attack on Titan" to be
 * recognised as the same franchise.
 */
export function getFranchiseKey(title: string): string {
  return title.replace(SEASON_SUFFIX_RE, "").trim().toLowerCase();
}

/**
 * Deduplicates an array of anime by franchise key, keeping only the entry
 * with the earliest release year (i.e. the first season).
 *
 * If two entries share the same franchise key and the same release year the
 * one that appears first in the input array is kept.
 */
export function getDeduplicatedByFranchise(animes: Anime[]): Anime[] {
  const seen = new Map<string, Anime>();
  for (const anime of animes) {
    const key = getFranchiseKey(anime.title);
    const existing = seen.get(key);
    if (!existing || anime.releaseYear < existing.releaseYear) {
      seen.set(key, anime);
    }
  }
  return Array.from(seen.values());
}

/**
 * Pick a random anime from the deduplicated (first-season only) pool,
 * optionally excluding a specific id (e.g. the current target).
 */
export function pickRandomTarget(animes: Anime[], exclude?: number): Anime {
  const pool = getDeduplicatedByFranchise(animes).filter(
    (a) => a.id !== exclude
  );
  return pool[Math.floor(Math.random() * pool.length)];
}
