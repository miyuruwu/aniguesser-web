import { getFranchiseKey, getDeduplicatedByFranchise, pickRandomTarget, MAX_GUESSES, CLUE_UNLOCK_AT } from "./gameUtils";
import { Anime } from "@/types/anime";

// Minimal Anime factory for tests
function makeAnime(overrides: Partial<Anime> & { id: number; title: string; releaseYear: number }): Anime {
  return {
    characterName: "",
    screenshotUrl: "",
    characterImageUrl: "",
    rating: 7.0,
    genres: [],
    studio: "Test Studio",
    ...overrides,
  };
}

describe("getFranchiseKey", () => {
  it("returns lowercase title unchanged when no season suffix", () => {
    expect(getFranchiseKey("Attack on Titan")).toBe("attack on titan");
  });

  it("strips 'Season N' suffix", () => {
    expect(getFranchiseKey("Attack on Titan Season 2")).toBe("attack on titan");
  });

  it("strips 'Nd Season' suffix", () => {
    expect(getFranchiseKey("My Hero Academia 2nd Season")).toBe("my hero academia");
  });

  it("strips 'Final Season' suffix", () => {
    expect(getFranchiseKey("Attack on Titan Final Season")).toBe("attack on titan");
  });

  it("strips 'Part N' suffix", () => {
    expect(getFranchiseKey("Jujutsu Kaisen Part 2")).toBe("jujutsu kaisen");
  });

  it("strips colon-prefixed season suffix", () => {
    expect(getFranchiseKey("My Hero Academia: Season 6")).toBe("my hero academia");
  });

  it("does not strip 'Brotherhood' or other subtitle words", () => {
    expect(getFranchiseKey("Fullmetal Alchemist: Brotherhood")).toBe(
      "fullmetal alchemist: brotherhood"
    );
  });
});

describe("getDeduplicatedByFranchise", () => {
  const animes: Anime[] = [
    makeAnime({ id: 1, title: "Attack on Titan", releaseYear: 2013 }),
    makeAnime({ id: 2, title: "Attack on Titan Season 2", releaseYear: 2017 }),
    makeAnime({ id: 3, title: "Attack on Titan Final Season", releaseYear: 2020 }),
    makeAnime({ id: 4, title: "Naruto", releaseYear: 2002 }),
    makeAnime({ id: 5, title: "Demon Slayer", releaseYear: 2019 }),
    makeAnime({ id: 6, title: "Demon Slayer Season 2", releaseYear: 2021 }),
  ];

  it("deduplicates to one entry per franchise", () => {
    const result = getDeduplicatedByFranchise(animes);
    expect(result).toHaveLength(3);
  });

  it("keeps the earliest release year (season 1) for each franchise", () => {
    const result = getDeduplicatedByFranchise(animes);
    const aot = result.find((a) => getFranchiseKey(a.title) === "attack on titan");
    expect(aot?.id).toBe(1);
    expect(aot?.releaseYear).toBe(2013);

    const ds = result.find((a) => getFranchiseKey(a.title) === "demon slayer");
    expect(ds?.id).toBe(5);
    expect(ds?.releaseYear).toBe(2019);
  });

  it("leaves a single-entry franchise unchanged", () => {
    const result = getDeduplicatedByFranchise(animes);
    const naruto = result.find((a) => a.title === "Naruto");
    expect(naruto).toBeDefined();
  });
});

describe("pickRandomTarget", () => {
  const animes: Anime[] = [
    makeAnime({ id: 1, title: "Anime A", releaseYear: 2010 }),
    makeAnime({ id: 2, title: "Anime B", releaseYear: 2012 }),
    makeAnime({ id: 3, title: "Anime C", releaseYear: 2015 }),
  ];

  it("returns an anime from the pool", () => {
    const picked = pickRandomTarget(animes);
    expect(animes.map((a) => a.id)).toContain(picked.id);
  });

  it("excludes the specified id", () => {
    // Run many times to ensure the excluded id never appears
    for (let i = 0; i < 50; i++) {
      const picked = pickRandomTarget(animes, 1);
      expect(picked.id).not.toBe(1);
    }
  });

  it("never picks a later-season entry when a first season exists", () => {
    const pool: Anime[] = [
      makeAnime({ id: 10, title: "Hero Show", releaseYear: 2015 }),
      makeAnime({ id: 11, title: "Hero Show Season 2", releaseYear: 2017 }),
    ];
    for (let i = 0; i < 50; i++) {
      const picked = pickRandomTarget(pool);
      expect(picked.id).toBe(10);
    }
  });
});

describe("game constants", () => {
  it("MAX_GUESSES is 10", () => {
    expect(MAX_GUESSES).toBe(10);
  });

  it("CLUE_UNLOCK_AT is 5", () => {
    expect(CLUE_UNLOCK_AT).toBe(5);
  });

  it("CLUE_UNLOCK_AT is less than MAX_GUESSES", () => {
    expect(CLUE_UNLOCK_AT).toBeLessThan(MAX_GUESSES);
  });
});
