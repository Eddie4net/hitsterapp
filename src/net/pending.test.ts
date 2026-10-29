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
    pending: null,
    stealPending: null,
    timerSeconds: 30,
    deadline: Date.now() + 30_000,
  });
}

const s = () => useGameStore.getState();

describe("openbare weergave: gekozen plekken en timer", () => {
  beforeEach(setup);

  it("laat de gekozen maar niet bevestigde plek zien", () => {
    s().pick(1);
    expect(toPublicState(s(), []).pending).toBe(1);
  });

  it("stuurt de resterende tijd, niet het tijdstip", () => {
    const now = Date.now();
    useGameStore.setState({ deadline: now + 12_345 });
    const view = toPublicState(s(), [], now);
    expect(view.timer).toEqual({ seconds: 30, remainingMs: 12_345 });
    expect(JSON.stringify(view)).not.toContain(String(now + 12_345));
  });

  it("geeft nooit een negatieve tijd", () => {
    const now = Date.now();
    useGameStore.setState({ deadline: now - 5000 });
    expect(toPublicState(s(), [], now).timer?.remainingMs).toBe(0);
  });

  it("heeft geen timer zonder deadline", () => {
    useGameStore.setState({ deadline: null });
    expect(toPublicState(s(), []).timer).toBeNull();
  });
});

describe("rechten bij kiezen en bevestigen", () => {
  beforeEach(setup);

  it("laat alleen de speler aan de beurt een plek kiezen en bevestigen", () => {
    expect(applyPlayerIntent(1, { type: "pick", index: 1 })).toBe(false);
    expect(applyPlayerIntent(0, { type: "pick", index: 1 })).toBe(true);
    expect(applyPlayerIntent(1, { type: "confirm" })).toBe(false);
    expect(applyPlayerIntent(0, { type: "confirm" })).toBe(true);
    expect(s().phase).toBe("steal");
  });

  it("weigert bevestigen zonder gekozen plek en een plek die niet bestaat", () => {
    expect(applyPlayerIntent(0, { type: "confirm" })).toBe(false);
    expect(applyPlayerIntent(0, { type: "pick", index: 99 })).toBe(false);
  });

  it("laat alleen de volgende steler een token neerleggen en bevestigen", () => {
    applyPlayerIntent(0, { type: "pick", index: 0 });
    applyPlayerIntent(0, { type: "confirm" });
    expect(applyPlayerIntent(1, { type: "stealPick", index: 1 })).toBe(false); // nog niet begonnen
    applyPlayerIntent(1, { type: "beginSteal" });
    expect(applyPlayerIntent(2, { type: "stealPick", index: 1 })).toBe(false);
    expect(applyPlayerIntent(1, { type: "stealConfirm" })).toBe(false); // nog niets gekozen
    expect(applyPlayerIntent(1, { type: "stealPick", index: 1 })).toBe(true);
    expect(applyPlayerIntent(1, { type: "stealPick", index: 2 })).toBe(true);
    expect(applyPlayerIntent(1, { type: "stealConfirm" })).toBe(true);
    expect(s().players[1].tokens).toBe(START_TOKENS - 1);
  });

  it("laat het tafelscherm alles doen", () => {
    applyHostIntent({ type: "pick", index: 2 });
    applyHostIntent({ type: "confirm" });
    expect(s().placements[0].index).toBe(2);
  });
});
