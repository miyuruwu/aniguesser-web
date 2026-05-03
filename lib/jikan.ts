import { Anime, JikanAnime, JikanAnimeResponse } from "@/types/anime";
import { animeData } from "@/data/animeData";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

/** Normalize a Jikan anime object into our internal Anime model */
function normalizeJikanAnime(jikan: JikanAnime): Anime {
  const releaseYear =
    jikan.year ??
    jikan.aired?.prop?.from?.year ??
    (jikan.aired?.from ? new Date(jikan.aired.from).getFullYear() : 0);

  const studio =
    jikan.studios && jikan.studios.length > 0
      ? jikan.studios[0].name
      : "Unknown";

  const genres = jikan.genres?.map((g) => g.name) ?? [];

  const imageUrl =
    jikan.images?.webp?.large_image_url ??
    jikan.images?.jpg?.large_image_url ??
    jikan.images?.jpg?.image_url ??
    "";

  return {
    id: jikan.mal_id,
    title: jikan.title_english ?? jikan.title,
    characterName: "",
    screenshotUrl: imageUrl,
    characterImageUrl: imageUrl,
    releaseYear,
    rating: jikan.score ?? 0,
    genres,
    studio,
    imageUrl,
    synopsis: jikan.synopsis ?? "",
  };
}

/** Derive a normalized base-series title by stripping season/sequel suffixes */
function getBaseSeriesTitle(title: string): string {
  return title
    .replace(/\s+Season\s+\d+\s*$/i, "")
    .replace(/\s+\d+(?:st|nd|rd|th)\s+Season\s*$/i, "")
    .replace(/\s+Part\s+\d+\s*$/i, "")
    .replace(/\s+(?:II|III|IV|V|VI|VII|VIII|IX|X)\s*$/, "")
    .trim()
    .toLowerCase();
}

/** Keep only the earliest-released entry per series to avoid showing duplicate seasons */
function keepFirstSeasonOnly(items: Anime[]): Anime[] {
  const map = new Map<string, Anime>();
  for (const item of items) {
    const base = getBaseSeriesTitle(item.title);
    const existing = map.get(base);
    if (
      !existing ||
      (item.releaseYear > 0 &&
        (existing.releaseYear === 0 || item.releaseYear < existing.releaseYear))
    ) {
      map.set(base, item);
    }
  }
  return Array.from(map.values());
}

/** Search anime by title via Jikan API; falls back to local data on error */
export async function searchAnimeByTitle(query: string): Promise<Anime[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query.trim())}&limit=10&sfw=true`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      throw new Error(`Jikan responded with status ${res.status}`);
    }

    const json: JikanAnimeResponse = await res.json();

    if (!json.data || json.data.length === 0) {
      return filterLocalAnime(query);
    }

    return keepFirstSeasonOnly(json.data.map(normalizeJikanAnime));
  } catch {
    // Graceful fallback to local data
    return filterLocalAnime(query);
  }
}

/** Fetch a single anime by MAL ID via Jikan API */
export async function fetchAnimeById(id: number): Promise<Anime | null> {
  try {
    const res = await fetch(`${JIKAN_BASE_URL}/anime/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Jikan responded with status ${res.status}`);
    }

    const json = await res.json();
    if (!json.data) return null;

    return normalizeJikanAnime(json.data as JikanAnime);
  } catch {
    return null;
  }
}

/** Filter local fallback data by query */
export function filterLocalAnime(query: string): Anime[] {
  const q = query.toLowerCase().trim();
  return animeData.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 10);
}

/** Pick a random anime from local data */
export function getRandomLocalAnime(): Anime {
  return animeData[Math.floor(Math.random() * animeData.length)];
}

/** Get all local anime titles for autocomplete */
export function getAllLocalTitles(): string[] {
  return animeData.map((a) => a.title);
}
