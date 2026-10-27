import { beforeEach, describe, expect, it } from "vitest";
import { START_TOKENS } from "@/game/rules";
import { useGameStore } from "@/game/store";
import type { Song } from "@/game/types";
import { applyHostIntent, applyPlayerIntent } from "./intents";
import { toPublicState } from "./publicState";

const song = (year: number): Song => ({
  id: `s${year}`,
  title: `Nummer ${year}`,
  artist: "Test",
  year,
});

function setup() {
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
  });
}

const s = () => useGameStore.getState();

describe("openbare weergave", () => {
  beforeEach(setup);

  it("verklapt het jaar van het huidige nummer niet", () => {
    useGameStore.setState({
      current: {
        id: "geheim",
        title: "Geheim nummer",
        artist: "Onbekend",
        year: 1995,
      },
    });
    const view = toPublicState(s(), []);
    expect(view.currentId).toBe("geheim");
    expect(JSON.stringify(view)).not.toContain("Geheim nummer");
    expect(JSON.stringify(view)).not.toContain("1995");
    expect(view.result).toBeNull();
  });

  it("neemt aanwezigheid van telefoons over", () => {
    const view = toPublicState(s(), [
      { remote: true, connected: true },
      { remote: true, connected: false },
    ]);
    expect(view.players[0]).toMatchObject({ remote: true, connected: true });
    expect(view.players[1]).toMatchObject({ remote: true, connected: false });
    expect(view.players[2]).toMatchObject({ remote: false, connected: true });
  });
});

describe("rechten van een telefoon", () => {
  beforeEach(setup);

  it("laat alleen de speler aan de beurt een kaartje leggen", () => {
    expect(applyPlayerIntent(1, { type: "place", index: 1 })).toBe(false);
    expect(s().phase).toBe("placing");
    expect(applyPlayerIntent(0, { type: "place", index: 1 })).toBe(true);
    expect(s().phase).toBe("steal");
  });

  it("weigert een plek die niet bestaat", () => {
    expect(applyPlayerIntent(0, { type: "place", index: 99 })).toBe(false);
    expect(applyPlayerIntent(0, { type: "place", index: -1 })).toBe(false);
    expect(applyPlayerIntent(0, { type: "place", index: 1.5 })).toBe(false);
  });

  it("laat alleen de volgende steler stelen", () => {
    applyPlayerIntent(0, { type: "place", index: 0 });
    expect(applyPlayerIntent(2, { type: "beginSteal" })).toBe(false);
    expect(applyPlayerIntent(1, { type: "beginSteal" })).toBe(true);
    expect(applyPlayerIntent(2, { type: "stealAt", index: 1 })).toBe(false);
    expect(applyPlayerIntent(1, { type: "stealAt", index: 1 })).toBe(true);
    expect(s().players[1].tokens).toBe(START_TOKENS - 1);
  });

  it("laat niemand anders dan de speler aan de beurt doorgaan", () => {
    applyPlayerIntent(0, { type: "place", index: 1 });
    applyPlayerIntent(1, { type: "pass" });
    applyPlayerIntent(2, { type: "pass" });
    expect(s().phase).toBe("reveal");
    expect(applyPlayerIntent(1, { type: "next" })).toBe(false);
    expect(applyPlayerIntent(0, { type: "next" })).toBe(true);
    expect(s().active).toBe(1);
  });

  it("laat een telefoon alleen voor zichzelf kopen", () => {
    useGameStore.setState({
      players: s().players.map((p) => ({ ...p, tokens: 3 })),
    });
    applyPlayerIntent(1, { type: "buy" });
    expect(s().players[1].tokens).toBe(0);
    expect(s().players[0].tokens).toBe(3);
  });
});

describe("het tafelscherm", () => {
  beforeEach(setup);

  it("mag voor iedereen handelen", () => {
    applyHostIntent({ type: "place", index: 1 });
    expect(s().phase).toBe("steal");
    applyHostIntent({ type: "pass" });
    applyHostIntent({ type: "pass" });
    expect(s().phase).toBe("reveal");
    applyHostIntent({ type: "next" });
    expect(s().active).toBe(1);
  });
});
