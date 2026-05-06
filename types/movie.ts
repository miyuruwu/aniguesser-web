export interface Movie {
  id: number;           // unique integer, starts at 1
  title: string;        // full English title, e.g. "The Dark Knight"
  releaseYear: number;  // 4-digit year of theatrical release
  rating: number;       // IMDb rating, one decimal, e.g. 8.8
  genres: string[];     // array of genre strings, e.g. ["Action", "Thriller"]
  director: string;     // full name, e.g. "Christopher Nolan"
  posterUrl: string;    // direct image URL (HTTPS)
  synopsis: string;     // 1-2 sentence plot summary
  tagline: string;      // official movie tagline
  watchUrl?: string;    // JustWatch or IMDb URL to watch/find the movie
  // Optional TMDB-sourced fields
  screenshotUrl?: string; // backdrop image (wide format)
  studio?: string;        // primary production company
  country?: string;       // primary production country
  leadActor?: string;     // top-billed cast member
}

export interface MovieGuessResult {
  movie: Movie;
  yearResult: "Earlier" | "Later" | "Correct";
  ratingResult: "Higher" | "Lower" | "Correct";
  matchingGenres: string[];
  directorResult: "Correct" | "Incorrect";
}
