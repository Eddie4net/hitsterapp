import { beforeEach, describe, expect, it } from "vitest";
import { BUY_COST, MAX_TOKENS, pickStarter, START_TOKENS } from "./rules";
import { useGameStore } from "./store";
import type { Song } from "./types";

const song = (year: number): Song => ({
  id: `s${year}`,
  title: `Nummer ${year}`,
  artist: "Test",
  year,
});

/** Zet een vaste situatie neer: drie spelers, speler 0 aan de beurt met het kaartje 1990. */
function setup(tokens = [START_TOKENS, START_TOKENS, START_TOKENS]) {
  useGameStore.setState({
    phase: "placing",
    players: tokens.map((t, id) => ({
      id,
      name: `P${id}`,
      timeline: [song(1970 + id * 10), song(2000 + id)],
      tokens: t,
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

describe("spelverloop met tokens", () => {
  beforeEach(() => setup());

  it("geeft het kaartje aan de speler aan de beurt bij een goede plek zonder stelen", () => {
    s().place(1); // tussen 1970 en 2000
    expect(s().phase).toBe("steal");
    s().pass();
    s().pass();
    expect(s().phase).toBe("reveal");
    expect(s().players[0].timeline.map((x) => x.year)).toEqual([
      1970, 1990, 2000,
    ]);
    expect(s().players.every((p) => p.tokens === START_TOKENS)).toBe(true);
  });

  it("slaat de stelfase over als niemand een token heeft", () => {
    setup([START_TOKENS, 0, 0]);
    s().place(1);
    expect(s().phase).toBe("reveal");
  });

  it("laat een steler een token betalen en het kaartje winnen bij een fout", () => {
    s().place(0); // fout
    s().beginSteal();
    s().stealAt(1); // goed
    expect(s().players[1].tokens).toBe(START_TOKENS - 1);
    s().pass(); // speler 2 past
    expect(s().phase).toBe("reveal");
    expect(s().result?.winnerId).toBe(1);
    expect(s().players[0].timeline).toHaveLength(2);
    expect(s().players[1].timeline.map((x) => x.year)).toContain(1990);
  });

  it("laat niet toe dat iemand dezelfde plek kiest", () => {
    s().place(1);
    s().beginSteal();
    s().stealAt(1);
    expect(s().stealing).toBe(true);
    expect(s().players[1].tokens).toBe(START_TOKENS);
  });

  it("kost een token om een nummer over te slaan", () => {
    s().skip();
    expect(s().players[0].tokens).toBe(START_TOKENS - 1);
    expect(s().current?.year).toBe(1960);
  });

  it("geeft een bonustoken, één keer per beurt en niet boven het maximum", () => {
    setup([MAX_TOKENS - 1, 0, 0]);
    s().place(1);
    s().claimBonus();
    s().claimBonus();
    expect(s().players[0].tokens).toBe(MAX_TOKENS);
  });
});

describe("officiële extra regels", () => {
  beforeEach(() => setup([BUY_COST, 0, 0]));

  it("wisselt 3 tokens in voor een kaartje uit de stapel, direct in de tijdlijn", () => {
    s().buy(0);
    expect(s().players[0].tokens).toBe(0);
    expect(s().players[0].timeline.map((x) => x.year)).toContain(1960);
    expect(s().deck).toHaveLength(1);
  });

  it("laat kopen niet toe met te weinig tokens", () => {
    s().buy(1);
    expect(s().players[1].timeline).toHaveLength(2);
    expect(s().deck).toHaveLength(2);
  });

  it("laat kopen ook toe in de beurt van een ander", () => {
    useGameStore.setState({ active: 1 });
    s().buy(0);
    expect(s().players[0].timeline).toHaveLength(3);
  });

  it("wint direct als je door te kopen het doel haalt", () => {
    useGameStore.setState({ target: 3 });
    s().buy(0);
    expect(s().phase).toBe("finished");
    expect(s().winnerId).toBe(0);
  });

  it("gebruikt geen tokens als die uitstaan", () => {
    useGameStore.setState({ tokensEnabled: false });
    s().buy(0);
    s().skip();
    expect(s().players[0].tokens).toBe(BUY_COST);
    s().place(1);
    expect(s().phase).toBe("reveal");
  });
});

describe("pickStarter", () => {
  it("kiest de speler met het oudste kaartje", () => {
    expect(pickStarter([song(1990), song(1965), song(2001)])).toBe(1);
    expect(pickStarter([song(1980), song(1980)])).toBe(0);
  });
});
