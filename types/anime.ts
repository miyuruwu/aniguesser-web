export interface Anime {
  id: number;
  title: string;
  characterName: string;
  screenshotUrl: string;
  characterImageUrl: string;
  releaseYear: number;
  rating: number;
  genres: string[];
  studio: string;
  imageUrl?: string;
  synopsis?: string;
}

export interface JikanAnimeResponse {
  data: JikanAnime[];
  pagination?: {
    has_next_page: boolean;
    current_page: number;
  };
}

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
    };
    webp?: {
      image_url: string;
      large_image_url?: string;
    };
  };
  aired?: {
    from?: string;
    prop?: {
      from?: { year?: number };
    };
  };
  score?: number;
  genres?: { name: string }[];
  studios?: { name: string }[];
  synopsis?: string;
  year?: number;
}

export type GameMode = "home" | "wordle" | "screenshot" | "movie" | "leaderboard";

export interface GuessResult {
  anime: Anime;
  yearResult: "Earlier" | "Later" | "Correct";
  ratingResult: "Higher" | "Lower" | "Correct";
  matchingGenres: string[];
  studioResult: "Correct" | "Incorrect";
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}

export interface GameScoreEntry {
  userId: string;
  username: string;
  score: number;
  timestamp: number;
}
