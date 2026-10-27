import { create } from "zustand";
import { hasWon, insertAt, isPlacementCorrect, shuffle } from "./rules";
import { SAMPLE_SONGS } from "./sampleSongs";
import type { Phase, Player, Result, Song } from "./types";

type GameState = {
  phase: Phase;
  players: Player[];
  deck: Song[];
  current: Song | null;
  active: number;
  result: Result | null;
  winnerId: number | null;
  target: number;
  start: (names: string[], target: number) => void;
  place: (index: number) => void;
  next: () => void;
  reset: () => void;
};

const initial = {
  phase: "setup" as Phase,
  players: [] as Player[],
  deck: [] as Song[],
  current: null,
  active: 0,
  result: null,
  winnerId: null,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initial,
  target: 10,

  start: (names, target) => {
    const deck = shuffle(SAMPLE_SONGS);
    // Zoals bij het bordspel begint iedereen met één kaartje in de tijdlijn.
    const players = names.map((name, id) => ({
      id,
      name,
      timeline: [deck[id]],
    }));
    const rest = deck.slice(names.length);
    set({
      ...initial,
      phase: "placing",
      players,
      current: rest[0],
      deck: rest.slice(1),
      target,
    });
  },

  place: (index) => {
    const { current, players, active, phase } = get();
    if (!current || phase !== "placing") return;
    const correct = isPlacementCorrect(
      players[active].timeline,
      index,
      current,
    );
    set({
      phase: "reveal",
      result: { song: current, correct, index },
      players: correct
        ? players.map((p, i) =>
            i === active
              ? { ...p, timeline: insertAt(p.timeline, index, current) }
              : p,
          )
        : players,
    });
  },

  next: () => {
    const { players, active, deck, target } = get();
    const winner = players.find((p) => hasWon(p.timeline, target));
    if (winner) {
      set({ phase: "finished", winnerId: winner.id });
      return;
    }
    if (deck.length === 0) {
      // Stapel op: de speler met de langste tijdlijn wint.
      const best = players.reduce((a, b) =>
        b.timeline.length > a.timeline.length ? b : a,
      );
      set({ phase: "finished", winnerId: best.id });
      return;
    }
    set({
      phase: "placing",
      active: (active + 1) % players.length,
      current: deck[0],
      deck: deck.slice(1),
      result: null,
    });
  },

  reset: () => set({ ...initial }),
}));
