import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { START_TOKENS } from "./rules";
import { useGameStore } from "./store";
import type { Song } from "./types";

const song = (year: number): Song => ({
  id: `s${year}`,
  title: `Nummer ${year}`,
  artist: "Test",
  year,
});

/** Drie spelers, speler 0 aan de beurt met het kaartje 1990. */
function setup(timerSeconds = 0) {
  useGameStore.setState({
    phase: "placing",
    players: [0, 1, 2].map((id) => ({
      id,
      name: `P${id}`,
      timeline: [song(1970 + id * 10), song(2000 + id)],
      tokens: START_TOKENS,
    })),
    deck: [song(1960), song(1961)],
    current: song(1990),
    active: 0,
    result: null,
    winnerId: null,
    target: 10,
    tokensEnabled: true,
    placements: [],
    stealQueue: [],
    stealing: false,
    bonusClaimed: false,
    pending: null,
    stealPending: null,
    timerSeconds,
    deadline: timerSeconds > 0 ? Date.now() + timerSeconds * 1000 : null,
  });
}

const s = () => useGameStore.getState();

describe("een plek kiezen, verplaatsen en bevestigen", () => {
  beforeEach(() => setup());

  it("kiest een plek zonder dat de beurt verder gaat", () => {
    s().pick(1);
    expect(s().pending).toBe(1);
    expect(s().phase).toBe("placing");
    expect(s().placements).toEqual([]);
  });

  it("laat de plek nog verplaatsen", () => {
    s().pick(1);
    s().pick(2);
    s().pick(0);
    expect(s().pending).toBe(0);
  });

  it("negeert een plek die niet bestaat", () => {
    s().pick(1);
    s().pick(99);
    s().pick(-1);
    s().pick(1.5);
    expect(s().pending).toBe(1);
  });

  it("gaat pas door na bevestigen, op de gekozen plek", () => {
    s().pick(2);
    s().pick(1);
    s().confirmPlace();
    expect(s().phase).toBe("steal");
    expect(s().placements).toEqual([{ playerId: 0, index: 1 }]);
    expect(s().pending).toBeNull();
  });

  it("doet niets als je bevestigt zonder een plek te kiezen", () => {
    s().confirmPlace();
    expect(s().phase).toBe("placing");
  });

  it("wist de gekozen plek bij een ander nummer", () => {
    s().pick(1);
    s().skip();
    expect(s().pending).toBeNull();
    expect(s().players[0].tokens).toBe(START_TOKENS - 1);
  });
});

describe("een token neerleggen, verplaatsen en bevestigen", () => {
  beforeEach(() => {
    setup();
    s().pick(0);
    s().confirmPlace();
    s().beginSteal();
  });

  it("legt het token neer zonder het uit te geven", () => {
    s().stealPick(1);
    expect(s().stealPending).toBe(1);
    expect(s().players[1].tokens).toBe(START_TOKENS);
    expect(s().phase).toBe("steal");
  });

  it("laat het token nog verplaatsen en geeft het pas bij bevestigen uit", () => {
    s().stealPick(1);
    s().stealPick(2);
    s().confirmSteal();
    expect(s().placements.at(-1)).toEqual({ playerId: 1, index: 2 });
    expect(s().players[1].tokens).toBe(START_TOKENS - 1);
    expect(s().stealPending).toBeNull();
  });

  it("weigert de plek van de speler aan de beurt", () => {
    s().stealPick(0);
    expect(s().stealPending).toBeNull();
  });

  it("wist de keuze als de steler past", () => {
    s().stealPick(1);
    s().pass();
    expect(s().stealPending).toBeNull();
  });

  it("bevestigen zonder keuze doet niets", () => {
    s().confirmSteal();
    expect(s().players[1].tokens).toBe(START_TOKENS);
  });
});

describe("bedenktijd", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("start de timer bij een nieuw spel", () => {
    useGameStore.getState().start(["A", "B"], 5, true, undefined, false, 30);
    expect(s().timerSeconds).toBe(30);
    expect(s().deadline).toBe(Date.now() + 30_000);
  });

  it("heeft geen timer als de bedenktijd 0 is", () => {
    useGameStore.getState().start(["A", "B"], 5, true, undefined, false, 0);
    expect(s().deadline).toBeNull();
  });

  it("stopt de timer zodra de plek bevestigd is", () => {
    setup(30);
    s().pick(1);
    expect(s().deadline).not.toBeNull();
    s().confirmPlace();
    expect(s().deadline).toBeNull();
  });

  it("begint opnieuw bij een ander nummer en bij de volgende beurt", () => {
    setup(30);
    vi.advanceTimersByTime(20_000);
    s().skip();
    expect(s().deadline).toBe(Date.now() + 30_000);

    s().pick(1);
    s().confirmPlace();
    s().pass();
    s().pass();
    expect(s().phase).toBe("reveal");
    vi.advanceTimersByTime(5_000);
    s().next();
    expect(s().deadline).toBe(Date.now() + 30_000);
  });
});
