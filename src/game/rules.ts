import type { Placement, Song } from "./types";

/** Officiële Hitster: wie als eerste 10 kaartjes in de tijdlijn heeft, wint. */
export const OFFICIAL_TARGET = 10;

/**
 * Tokens. Deze aantallen staan hier op één plek zodat je ze makkelijk kunt
 * aanpassen aan jouw versie van het bordspel.
 */
export const START_TOKENS = 2;
export const MAX_TOKENS = 5;

/** Officieel: 3 tokens inwisselen voor een kaartje uit de stapel, direct in je tijdlijn. */
export const BUY_COST = 3;

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

/** Zet een kaartje op de plek waar het op jaar hoort (voor een gestolen kaartje). */
export function insertSorted(timeline: Song[], song: Song): Song[] {
  const found = timeline.findIndex((s) => s.year > song.year);
  return insertAt(timeline, found === -1 ? timeline.length : found, song);
}

/**
 * Wie krijgt het kaartje? `placements[0]` is de speler aan de beurt, de rest
 * zijn stelpogingen in volgorde. Had de speler aan de beurt het goed, dan houdt
 * die het kaartje. Anders krijgt de eerste stelende speler met een goede plek het.
 */
export function resolveRound(
  song: Song,
  activeTimeline: Song[],
  placements: Placement[],
): { winnerId: number | null; activeCorrect: boolean } {
  const [first, ...stealers] = placements;
  if (isPlacementCorrect(activeTimeline, first.index, song)) {
    return { winnerId: first.playerId, activeCorrect: true };
  }
  const stealer = stealers.find((p) =>
    isPlacementCorrect(activeTimeline, p.index, song),
  );
  return { winnerId: stealer?.playerId ?? null, activeCorrect: false };
}

/** Wie begint? De speler met het oudste kaartje (bij gelijk jaar de eerste in de rij). */
export function pickStarter(startCards: Song[]): number {
  let best = 0;
  startCards.forEach((card, i) => {
    if (card.year < startCards[best].year) best = i;
  });
  return best;
}
