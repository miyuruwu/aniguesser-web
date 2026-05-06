/**
 * scripts/fetchMovies.mjs
 *
 * Fetch 1000 high-quality movies from TMDB and write to data/movieData.ts
 *
 * Usage:
 *   $env:TMDB_ACCESS_TOKEN="eyJhbGci..."   (PowerShell)
 *   node scripts/fetchMovies.mjs
 *
 * Or with token inline (PowerShell):
 *   $env:TMDB_ACCESS_TOKEN="eyJ..."; node scripts/fetchMovies.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─── Config ────────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "data", "movieData.ts");

const TOKEN = process.env.TMDB_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("❌  TMDB_ACCESS_TOKEN environment variable is not set.");
  console.error(
    "    Run:  $env:TMDB_ACCESS_TOKEN=\"<your_token>\"; node scripts/fetchMovies.mjs"
  );
  process.exit(1);
}

const TMDB_BASE    = "https://api.themoviedb.org/3";
const POSTER_BASE  = "https://image.tmdb.org/t/p/w342";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";
const RATE_LIMIT_MS = 50;   // delay between each HTTP call
const RETRY_WAIT_MS = 10_000;
const MAX_RETRIES   = 3;
const PAGES         = 50;   // 50 pages × 20 = 1000 movies max

// ─── Country ISO → readable name ──────────────────────────────────────────────
const COUNTRY_MAP = {
  US: "USA", GB: "UK", FR: "France", DE: "Germany", JP: "Japan",
  KR: "South Korea", IT: "Italy", ES: "Spain", CA: "Canada",
  AU: "Australia", IN: "India", CN: "China", MX: "Mexico",
  BR: "Brazil", RU: "Russia", SE: "Sweden", DK: "Denmark",
  NO: "Norway", NL: "Netherlands", BE: "Belgium", AT: "Austria",
  CH: "Switzerland", PL: "Poland", IE: "Ireland", NZ: "New Zealand",
  ZA: "South Africa", AR: "Argentina", HK: "Hong Kong", TW: "Taiwan",
  TH: "Thailand",
};

// ─── Utilities ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tmdbGet(endpoint) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${TMDB_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, accept: "application/json" },
    });

    if (res.status === 429) {
      if (attempt < MAX_RETRIES) {
        console.warn(`  ⚠  Rate limited (429). Waiting ${RETRY_WAIT_MS / 1000}s… (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(RETRY_WAIT_MS);
        continue;
      }
      throw new Error(`HTTP 429 after ${MAX_RETRIES} retries: ${endpoint}`);
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${endpoint}`);
    return res.json();
  }
}

/** Escape a string for safe embedding in a TS template literal / single-quoted string */
function esc(str) {
  return JSON.stringify(String(str ?? ""));
}

/** Build a single movie object literal for the .ts file */
function buildMovieLiteral(movie, sequentialId) {
  const lines = [
    `  {`,
    `    id: ${sequentialId},`,
    `    title: ${esc(movie.title)},`,
    `    releaseYear: ${movie.releaseYear},`,
    `    rating: ${movie.rating},`,
    `    genres: [${movie.genres.map(esc).join(", ")}],`,
    `    director: ${esc(movie.director)},`,
  ];

  if (movie.studio)      lines.push(`    studio: ${esc(movie.studio)},`);
  if (movie.country)     lines.push(`    country: ${esc(movie.country)},`);
  if (movie.leadActor)   lines.push(`    leadActor: ${esc(movie.leadActor)},`);

  lines.push(
    `    posterUrl: ${esc(movie.posterUrl)},`,
  );

  if (movie.screenshotUrl) lines.push(`    screenshotUrl: ${esc(movie.screenshotUrl)},`);

  lines.push(
    `    synopsis: ${esc(movie.synopsis)},`,
    `    tagline: ${esc(movie.tagline || "")},`,
  );

  if (movie.watchUrl) lines.push(`    watchUrl: ${esc(movie.watchUrl)},`);

  lines.push(`  }`);
  return lines.join("\n");
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🎬  AniGuesser — TMDB Movie Fetcher");
  console.log(`    Target: ${PAGES * 20} movies from TMDB\n`);

  const movies = [];
  const seenIds = new Set();
  let processedCount = 0;

  for (let page = 1; page <= PAGES; page++) {
    await sleep(RATE_LIMIT_MS);

    let discover;
    try {
      discover = await tmdbGet(
        `/discover/movie?sort_by=vote_average.desc&vote_count.gte=500&include_adult=false&language=en-US&page=${page}`
      );
    } catch (err) {
      console.error(`  ✗ Page ${page} failed: ${err.message} — skipping`);
      continue;
    }

    console.log(`📄  Page ${page}/${PAGES} — ${discover.results.length} items`);

    for (const item of discover.results) {
      // Skip duplicates and items without poster/overview
      if (seenIds.has(item.id))             continue;
      if (!item.poster_path || !item.overview) continue;

      seenIds.add(item.id);

      // Parse release year
      const releaseYear = item.release_date
        ? parseInt(item.release_date.split("-")[0], 10)
        : 0;
      if (!releaseYear || releaseYear < 1900) continue;

      await sleep(RATE_LIMIT_MS);

      // Fetch detail + credits in parallel
      let detail, credits;
      try {
        [detail, credits] = await Promise.all([
          tmdbGet(`/movie/${item.id}?language=en-US`),
          tmdbGet(`/movie/${item.id}/credits?language=en-US`),
        ]);
      } catch (err) {
        console.warn(`  ✗ Detail fetch failed for "${item.title}" (id=${item.id}): ${err.message}`);
        continue;
      }

      const genres = (detail.genres ?? []).map((g) => g.name);
      if (genres.length === 0) continue;

      const director   = credits.crew?.find((c) => c.job === "Director")?.name ?? "Unknown";
      const leadActor  = credits.cast?.[0]?.name;
      const studio     = detail.production_companies?.[0]?.name;
      const isoCode    = detail.production_countries?.[0]?.iso_3166_1;
      const country    = isoCode ? (COUNTRY_MAP[isoCode] ?? isoCode) : undefined;
      const tagline    = detail.tagline || "";

      const movie = {
        tmdbId:       item.id,   // store original TMDB id for de-dup
        title:        item.title,
        releaseYear,
        rating:       Math.round(item.vote_average * 10) / 10,
        genres,
        director,
        studio:       studio   || undefined,
        country:      country  || undefined,
        leadActor:    leadActor || undefined,
        posterUrl:    `${POSTER_BASE}${item.poster_path}`,
        screenshotUrl: item.backdrop_path
          ? `${BACKDROP_BASE}${item.backdrop_path}`
          : undefined,
        synopsis:     item.overview,
        tagline:      tagline || undefined,
        watchUrl:     `https://www.themoviedb.org/movie/${item.id}`,
      };

      movies.push(movie);
      processedCount++;

      if (processedCount % 10 === 0) {
        process.stdout.write(`  ✓ Processed ${processedCount} movies…\r`);
      }
    }
  }

  console.log(`\n\n✅  Fetched ${movies.length} valid movies from TMDB.`);

  // Sort by rating descending, then by title for ties
  movies.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.title.localeCompare(b.title);
  });

  // Assign sequential ids (1-based)
  const numbered = movies.map((m, idx) => ({ ...m, id: idx + 1 }));

  // Build output file
  const literals = numbered.map((m) => buildMovieLiteral(m, m.id)).join(",\n");

  const output = `// AUTO-GENERATED by scripts/fetchMovies.mjs — DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}
// Source: TMDB API (${movies.length} movies)
import type { Movie } from "@/types/movie";

export const movieData: Movie[] = [
${literals},
];
`;

  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");
  console.log(`\n📁  Written to: ${OUTPUT_FILE}`);
  console.log(`    Total movies: ${numbered.length}`);
  console.log(`    Top 5 by rating:`);
  numbered.slice(0, 5).forEach((m) =>
    console.log(`      ${m.id}. ${m.title} (${m.releaseYear}) — ⭐ ${m.rating}`)
  );
  console.log("\n🎉  Done! Restart your dev server to use the new data.");
}

main().catch((err) => {
  console.error("\n❌  Fatal error:", err);
  process.exit(1);
});
