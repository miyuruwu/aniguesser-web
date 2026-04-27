"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Anime } from "@/types/anime";
import { searchAnimeByTitle } from "@/lib/jikan";

interface AutocompleteInputProps {
  placeholder?: string;
  onSelect: (anime: Anime) => void;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export default function AutocompleteInput({
  placeholder = "Search anime...",
  onSelect,
  disabled = false,
  value,
  onChange,
}: AutocompleteInputProps) {
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // sync external value
  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchAnimeByTitle(query);
        setSuggestions(results);
        setOpen(results.length > 0);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange?.(e.target.value);
  };

  const handleSelect = (anime: Anime) => {
    setQuery(anime.title);
    onChange?.(anime.title);
    setSuggestions([]);
    setOpen(false);
    onSelect(anime);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3 w-4 h-4 text-anime-accent animate-spin pointer-events-none" />
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-anime-card border border-anime-border text-white placeholder-gray-500 focus:outline-none focus:border-anime-accent focus:ring-1 focus:ring-anime-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {open && (
        <ul className="absolute z-50 top-full mt-1 w-full rounded-lg bg-anime-card border border-anime-border shadow-xl max-h-64 overflow-y-auto">
          {suggestions.map((anime) => (
            <li
              key={anime.id}
              onClick={() => handleSelect(anime)}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-anime-accent/20 transition-colors"
            >
              {anime.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="w-8 h-10 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{anime.title}</p>
                {anime.releaseYear > 0 && (
                  <p className="text-xs text-gray-400">{anime.releaseYear}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
