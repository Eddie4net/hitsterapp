import { useGameStore } from "@/game/store";
import type { Song } from "@/game/types";
import { combineYears } from "./year";

type Looked = { year: number; source: "spotify" | "musicbrainz" };

/** Vraagt het oorspronkelijke jaartal op. Bij een fout of geen match blijft het jaar van Spotify staan. */
export async function lookupYear(
  song: Song,
  signal?: AbortSignal,
): Promise<Looked> {
  const fallback: Looked = { year: song.year, source: "spotify" };
  try {
    const url = `/api/year?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`;
    const response = await fetch(url, { signal });
    if (!response.ok) return fallback;
    const json = (await response.json()) as { year: number | null };
    return combineYears(song.year, json.year);
  } catch {
    return fallback;
  }
}

const needsCheck = (s: Song) => Boolean(s.uri) && !s.yearChecked;

/**
 * Controleert vooraf de jaartallen van de eerste `count` nummers (de startkaartjes en de
 * eerste die getrokken worden), één voor één. Geeft de lijst terug met bijgewerkte jaartallen.
 */
export async function checkFirstYears(
  songs: Song[],
  count: number,
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Song[]> {
  const result = [...songs];
  const total = Math.min(count, result.length);
  for (let i = 0; i < total; i++) {
    if (signal?.aborted) break;
    const song = result[i];
    if (needsCheck(song)) {
      const found = await lookupYear(song, signal);
      result[i] = {
        ...song,
        year: found.year,
        yearSource: found.source,
        yearChecked: true,
      };
    }
    onProgress(i + 1, total);
  }
  return result;
}

let runId = 0;

/**
 * Loopt tijdens het spel door de stapel en controleert de jaartallen van de nummers die
 * nog moeten komen, in de volgorde waarin ze getrokken worden. Stopt als het spel stopt.
 */
export function startBackgroundYearCheck(): void {
  const myRun = ++runId;
  void (async () => {
    const ids = useGameStore
      .getState()
      .deck.filter(needsCheck)
      .map((s) => s.id);
    for (const id of ids) {
      if (myRun !== runId) return;
      const state = useGameStore.getState();
      if (state.phase === "setup" || state.phase === "finished") return;
      const song = state.deck.find((s) => s.id === id);
      if (!song || !needsCheck(song)) continue;
      const found = await lookupYear(song);
      if (myRun !== runId) return;
      useGameStore.getState().updateSongYear(id, found.year, found.source);
    }
  })();
}

export function stopBackgroundYearCheck(): void {
  runId++;
}
