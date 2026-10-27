import type { Song } from "./types";

/** Officiële Hitster: wie als eerste 10 kaartjes in de tijdlijn heeft, wint. */
export const OFFICIAL_TARGET = 10;

/**
 * Staat het kaartje goed als het op positie `index` in de tijdlijn komt?
 * Hetzelfde jaar als een buurkaartje telt als goed.
 */
export function isPlacementCorrect(
  timeline: Song[],
  index: number,
  song: Song,
): boolean {
  const before = timeline[index - 1];
  const after = timeline[index];
  return (
    (before === undefined || before.year <= song.year) &&
    (after === undefined || song.year <= after.year)
  );
}

export function insertAt(timeline: Song[], index: number, song: Song): Song[] {
  return [...timeline.slice(0, index), song, ...timeline.slice(index)];
}

export function hasWon(timeline: Song[], target: number): boolean {
  return timeline.length >= target;
}

/** Fisher-Yates; `random` is los te zetten zodat tests voorspelbaar blijven. */
export function shuffle<T>(
  items: T[],
  random: () => number = Math.random,
): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Tekst voor schermlezers en knoppen: waar komt het kaartje te liggen? */
export function describeSlot(timeline: Song[], index: number): string {
  const before = timeline[index - 1];
  const after = timeline[index];
  if (before && after) return `tussen ${before.year} en ${after.year}`;
  if (after) return `vóór ${after.year}`;
  if (before) return `na ${before.year}`;
  return "als eerste kaartje";
}
