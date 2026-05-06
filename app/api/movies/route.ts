import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Movie } from "@/types/movie";

// ─── Constants ────────────────────────────────────────────────────────────────
const CACHE_FILE = path.join(process.cwd(), "data", "tmdb_cache.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
const TARGET_COUNT = 200; // 10 pages × 20 results
const RATE_LIMIT_MS = 60;

// ─── TMDB raw shapes ──────────────────────────────────────────────────────────
interface TmdbMovieItem {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
}
interface TmdbDiscoverResponse { results: TmdbMovieItem[]; }
interface TmdbGenre { id: number; name: string; }
interface TmdbDetailResponse {
  tagline: string;
  genres: TmdbGenre[];
  production_companies: { name: string }[];
  production_countries: { name: string }[];
  imdb_id: string | null;
}
interface TmdbCrew  { job: string; name: string; }
interface TmdbCast  { order: number; name: string; }
interface TmdbCreditsResponse { crew: TmdbCrew[]; cast: TmdbCast[]; }

// ─── Cache file structure ─────────────────────────────────────────────────────
interface CacheFile { fetchedAt: number; movies: Movie[]; }

// ─── Utilities ────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function readCache(): CacheFile | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as CacheFile;
  } catch { return null; }
}

function writeCache(data: CacheFile): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), "utf-8");
  } catch { /* non-fatal */ }
}

async function tmdbGet<T>(endpoint: string, token: string): Promise<T> {
  const res = await fetch(`${TMDB_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} ${endpoint}`);
  return res.json() as Promise<T>;
}

// ─── Main fetcher ─────────────────────────────────────────────────────────────
async function fetchMovies(token: string): Promise<Movie[]> {
  const movies: Movie[] = [];
  const seen = new Set<number>();
  const pages = Math.ceil(TARGET_COUNT / 20);

  for (let page = 1; page <= pages && movies.length < TARGET_COUNT; page++) {
    await sleep(RATE_LIMIT_MS);
    let disc: TmdbDiscoverResponse;
    try {
      disc = await tmdbGet<TmdbDiscoverResponse>(
        `/discover/movie?sort_by=vote_average.desc&vote_count.gte=1000&include_adult=false&language=en-US&page=${page}`,
        token
      );
    } catch { continue; }

    for (const item of disc.results) {
      if (movies.length >= TARGET_COUNT) break;
      if (seen.has(item.id) || !item.poster_path || !item.overview) continue;
      seen.add(item.id);

      await sleep(RATE_LIMIT_MS);
      let detail: TmdbDetailResponse;
      let credits: TmdbCreditsResponse;
      try {
        [detail, credits] = await Promise.all([
          tmdbGet<TmdbDetailResponse>(`/movie/${item.id}?language=en-US`, token),
          tmdbGet<TmdbCreditsResponse>(`/movie/${item.id}/credits?language=en-US`, token),
        ]);
      } catch { continue; }

      const releaseYear = item.release_date ? parseInt(item.release_date.split("-")[0], 10) : 0;
      if (!releaseYear || releaseYear < 1900) continue;

      const genres = detail.genres.map((g) => g.name);
      if (genres.length === 0) continue;

      const director = credits.crew.find((c) => c.job === "Director")?.name ?? "Unknown";
      const leadActor = [...credits.cast].sort((a, b) => a.order - b.order)[0]?.name;
      const studio    = detail.production_companies[0]?.name;
      const country   = detail.production_countries[0]?.name;

      movies.push({
        id: item.id,
        title: item.title,
        releaseYear,
        rating: Math.round(item.vote_average * 10) / 10,
        genres,
        director,
        posterUrl: `${POSTER_BASE}${item.poster_path}`,
        synopsis: item.overview,
        tagline: detail.tagline || item.title,
        screenshotUrl: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : undefined,
        watchUrl: detail.imdb_id ? `https://www.imdb.com/title/${detail.imdb_id}/` : undefined,
        studio,
        country,
        leadActor,
      });
    }
  }
  return movies;
}

// ─── Background refresh (fire-and-forget) ────────────────────────────────────
let refreshing = false;
async function triggerRefresh(token: string) {
  if (refreshing) return;
  refreshing = true;
  try {
    const fresh = await fetchMovies(token);
    if (fresh.length > 0) writeCache({ fetchedAt: Date.now(), movies: fresh });
  } finally { refreshing = false; }
}

// ─── GET Handler ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "TMDB_ACCESS_TOKEN not configured" }, { status: 500 });
  }

  const action = new URL(request.url).searchParams.get("action") ?? "all";
  const cache  = readCache();

  // Cold start – synchronous fetch
  if (!cache) {
    try {
      const movies = await fetchMovies(token);
      if (!movies.length) throw new Error("Empty result");
      writeCache({ fetchedAt: Date.now(), movies });
      return respond(movies, action);
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 502 });
    }
  }

  // Stale – serve old data, refresh in background
  if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
    void triggerRefresh(token);
  }

  return respond(cache.movies, action);
}

function respond(movies: Movie[], action: string): NextResponse {
  if (action === "random") {
    return NextResponse.json(movies[Math.floor(Math.random() * movies.length)]);
  }
  return NextResponse.json(movies);
}
