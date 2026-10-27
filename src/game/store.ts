import { create } from "zustand";
import {
  hasWon,
  insertAt,
  insertSorted,
  MAX_TOKENS,
  resolveRound,
  START_TOKENS,
  shuffle,
} from "./rules";
import { SAMPLE_SONGS } from "./sampleSongs";
import type { Phase, Placement, Player, Result, Song } from "./types";

type GameState = {
  phase: Phase;
  players: Player[];
  deck: Song[];
  current: Song | null;
  active: number;
  result: Result | null;
  winnerId: number | null;
  target: number;
  placements: Placement[];
  /** Spelers die nog mogen kiezen of ze willen stelen, in volgorde. */
  stealQueue: number[];
  /** True zodra de eerstvolgende steler heeft gekozen om te stelen. */
  stealing: boolean;
  bonusClaimed: boolean;
  start: (names: string[], target: number) => void;
  place: (index: number) => void;
  beginSteal: () => void;
  stealAt: (index: number) => void;
  pass: () => void;
  skip: () => void;
  claimBonus: () => void;
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
  placements: [] as Placement[],
  stealQueue: [] as number[],
  stealing: false,
  bonusClaimed: false,
};

export const useGameStore = create<GameState>((set, get) => {
  /** Verdeel het kaartje en laat het jaar zien. */
  function resolve() {
    const { current, players, active, placements } = get();
    if (!current) return;
    const activePlayer = players[active];
    const { winnerId, activeCorrect } = resolveRound(
      current,
      activePlayer.timeline,
      placements,
    );
    set({
      phase: "reveal",
      stealQueue: [],
      stealing: false,
      result: { song: current, winnerId, activeCorrect, placements },
      players: players.map((p) => {
        if (p.id !== winnerId) return p;
        return {
          ...p,
          timeline:
            p.id === activePlayer.id
              ? insertAt(p.timeline, placements[0].index, current)
              : insertSorted(p.timeline, current),
        };
      }),
    });
  }

  return {
    ...initial,
    target: 10,

    start: (names, target) => {
      const deck = shuffle(SAMPLE_SONGS);
      // Zoals bij het bordspel begint iedereen met één kaartje en wat tokens.
      const players = names.map((name, id) => ({
        id,
        name,
        timeline: [deck[id]],
        tokens: START_TOKENS,
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
      const placements = [{ playerId: players[active].id, index }];
      const stealQueue = players
        .map((_, i) => players[(active + 1 + i) % players.length])
        .filter((p) => p.id !== players[active].id && p.tokens >= 1)
        .map((p) => p.id);
      set({ placements, stealQueue, stealing: false });
      if (stealQueue.length === 0) resolve();
      else set({ phase: "steal" });
    },

    beginSteal: () => {
      if (get().phase === "steal") set({ stealing: true });
    },

    stealAt: (index) => {
      const { phase, stealing, stealQueue, placements, players } = get();
      if (phase !== "steal" || !stealing) return;
      if (placements.some((p) => p.index === index)) return;
      const [stealerId, ...rest] = stealQueue;
      set({
        placements: [...placements, { playerId: stealerId, index }],
        players: players.map((p) =>
          p.id === stealerId ? { ...p, tokens: p.tokens - 1 } : p,
        ),
        stealQueue: rest,
        stealing: false,
      });
      if (rest.length === 0) resolve();
    },

    pass: () => {
      const { phase, stealQueue } = get();
      if (phase !== "steal") return;
      const rest = stealQueue.slice(1);
      set({ stealQueue: rest, stealing: false });
      if (rest.length === 0) resolve();
    },

    skip: () => {
      const { phase, players, active, deck } = get();
      if (phase !== "placing" || players[active].tokens < 1) return;
      if (deck.length === 0) return;
      set({
        players: players.map((p, i) =>
          i === active ? { ...p, tokens: p.tokens - 1 } : p,
        ),
        current: deck[0],
        deck: deck.slice(1),
      });
    },

    // Op eer: de groep beslist of artiest én titel goed geraden zijn.
    claimBonus: () => {
      const { phase, bonusClaimed, players, active } = get();
      if (phase !== "reveal" || bonusClaimed) return;
      if (players[active].tokens >= MAX_TOKENS) return;
      set({
        bonusClaimed: true,
        players: players.map((p, i) =>
          i === active ? { ...p, tokens: p.tokens + 1 } : p,
        ),
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
        placements: [],
        stealQueue: [],
        stealing: false,
        bonusClaimed: false,
      });
    },

    reset: () => set({ ...initial }),
  };
});
