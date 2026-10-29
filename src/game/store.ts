import { create } from "zustand";
import {
  BUY_COST,
  hasWon,
  insertAt,
  insertSorted,
  MAX_TOKENS,
  pickStarter,
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
  /** Officieel spelen met tokens (stelen, overslaan, kaartje kopen). */
  tokensEnabled: boolean;
  placements: Placement[];
  /** Spelers die nog mogen kiezen of ze willen stelen, in volgorde. */
  stealQueue: number[];
  /** True zodra de eerstvolgende steler heeft gekozen om te stelen. */
  stealing: boolean;
  bonusClaimed: boolean;
  /** Plek die de speler aan de beurt heeft gekozen maar nog niet heeft bevestigd (verplaatsen mag nog). */
  pending: number | null;
  /** Plek waar de steler zijn token heeft neergelegd maar nog niet heeft bevestigd. */
  stealPending: number | null;
  /** Bedenktijd per nummer in seconden (0 = geen timer). */
  timerSeconds: number;
  /** Tijdstip (ms) waarop de bedenktijd afloopt, of null als er geen timer loopt. */
  deadline: number | null;
  start: (
    names: string[],
    target: number,
    tokensEnabled?: boolean,
    songs?: Song[],
    /** True als de lijst al in de gewenste volgorde staat (jaartallen zijn dan vooraf gecontroleerd). */
    preShuffled?: boolean,
    /** Bedenktijd per nummer in seconden; 0 of weglaten voor geen timer. */
    timerSeconds?: number,
  ) => void;
  /** Past het jaartal van een nummer aan dat nog in de stapel ligt (of nu geraden wordt). */
  updateSongYear: (
    id: string,
    year: number,
    source: Song["yearSource"],
  ) => void;
  place: (index: number) => void;
  /** Kies (of verplaats) een plek zonder te bevestigen. */
  pick: (index: number) => void;
  /** Bevestig de gekozen plek: daarna kunnen anderen stelen. */
  confirmPlace: () => void;
  stealPick: (index: number) => void;
  confirmSteal: () => void;
  beginSteal: () => void;
  stealAt: (index: number) => void;
  pass: () => void;
  skip: () => void;
  buy: (playerId: number) => void;
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
  pending: null as number | null,
  stealPending: null as number | null,
  deadline: null as number | null,
};

/** Nieuwe bedenktijd: eindtijdstip, of null zonder timer. */
const deadlineFor = (seconds: number) =>
  seconds > 0 ? Date.now() + seconds * 1000 : null;

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
    tokensEnabled: true,
    timerSeconds: 0,

    start: (
      names,
      target,
      tokensEnabled = true,
      songs = SAMPLE_SONGS,
      preShuffled = false,
      timerSeconds = 0,
    ) => {
      const n = names.length;
      const deck = preShuffled ? songs : shuffle(songs);
      // Iedereen begint met één kaartje in de tijdlijn.
      const players = names.map((name, id) => ({
        id,
        name,
        timeline: [deck[id]],
        tokens: tokensEnabled ? START_TOKENS : 0,
      }));
      // Officieel: iedereen trekt een kaartje, het oudste begint. Die kaartjes gaan terug in de stapel.
      const starterCards = deck.slice(n, 2 * n);
      const active = pickStarter(starterCards);
      const leftover = [...deck.slice(2 * n), ...starterCards];
      const rest = preShuffled ? leftover : shuffle(leftover);
      set({
        ...initial,
        phase: "placing",
        players,
        active,
        current: rest[0],
        deck: rest.slice(1),
        target,
        tokensEnabled,
        timerSeconds,
        deadline: deadlineFor(timerSeconds),
      });
    },

    place: (index) => {
      const { current, players, active, phase, tokensEnabled } = get();
      if (!current || phase !== "placing") return;
      const placements = [{ playerId: players[active].id, index }];
      const stealQueue = tokensEnabled
        ? players
            .map((_, i) => players[(active + 1 + i) % players.length])
            .filter((p) => p.id !== players[active].id && p.tokens >= 1)
            .map((p) => p.id)
        : [];
      set({
        placements,
        stealQueue,
        stealing: false,
        pending: null,
        stealPending: null,
        deadline: null,
      });
      if (stealQueue.length === 0) resolve();
      else set({ phase: "steal" });
    },

    pick: (index) => {
      const { phase, players, active } = get();
      if (phase !== "placing") return;
      const slots = players[active].timeline.length;
      if (!Number.isInteger(index) || index < 0 || index > slots) return;
      set({ pending: index });
    },

    confirmPlace: () => {
      const { pending } = get();
      if (pending === null) return;
      get().place(pending);
    },

    stealPick: (index) => {
      const { phase, stealing, placements, players, active } = get();
      if (phase !== "steal" || !stealing) return;
      const slots = players[active].timeline.length;
      if (!Number.isInteger(index) || index < 0 || index > slots) return;
      if (placements.some((p) => p.index === index)) return;
      set({ stealPending: index });
    },

    confirmSteal: () => {
      const { stealPending } = get();
      if (stealPending === null) return;
      get().stealAt(stealPending);
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
        stealPending: null,
      });
      if (rest.length === 0) resolve();
    },

    pass: () => {
      const { phase, stealQueue } = get();
      if (phase !== "steal") return;
      const rest = stealQueue.slice(1);
      set({ stealQueue: rest, stealing: false, stealPending: null });
      if (rest.length === 0) resolve();
    },

    skip: () => {
      const { phase, players, active, deck, tokensEnabled } = get();
      if (!tokensEnabled || phase !== "placing" || players[active].tokens < 1) {
        return;
      }
      if (deck.length === 0) return;
      set({
        players: players.map((p, i) =>
          i === active ? { ...p, tokens: p.tokens - 1 } : p,
        ),
        current: deck[0],
        deck: deck.slice(1),
        pending: null,
        deadline: deadlineFor(get().timerSeconds),
      });
    },

    // Officieel kan dit op elk moment, ook in de beurt van een ander.
    buy: (playerId) => {
      const { phase, players, deck, target, tokensEnabled } = get();
      if (!tokensEnabled || phase === "setup" || phase === "finished") return;
      const buyer = players.find((p) => p.id === playerId);
      if (!buyer || buyer.tokens < BUY_COST || deck.length === 0) return;
      const updated = players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              tokens: p.tokens - BUY_COST,
              timeline: insertSorted(p.timeline, deck[0]),
            }
          : p,
      );
      const won = updated.find((p) => hasWon(p.timeline, target));
      set({
        players: updated,
        deck: deck.slice(1),
        ...(won ? { phase: "finished" as Phase, winnerId: won.id } : {}),
      });
    },

    // Op eer: de groep beslist of artiest én titel goed geraden zijn.
    claimBonus: () => {
      const { phase, bonusClaimed, players, active, tokensEnabled } = get();
      if (!tokensEnabled || phase !== "reveal" || bonusClaimed) return;
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
        pending: null,
        stealPending: null,
        deadline: deadlineFor(get().timerSeconds),
      });
    },

    updateSongYear: (id, year, source) => {
      const { deck, current, phase } = get();
      const apply = (s: Song) =>
        s.id === id ? { ...s, year, yearSource: source, yearChecked: true } : s;
      set({
        deck: deck.map(apply),
        // Het nummer dat nu geraden wordt mag alleen veranderen zolang er nog niemand heeft gekozen.
        current: current && phase === "placing" ? apply(current) : current,
      });
    },

    reset: () => set({ ...initial }),
  };
});

export type { Player };
