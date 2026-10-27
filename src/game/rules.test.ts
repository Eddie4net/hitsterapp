import { describe, expect, it } from "vitest";
import {
  describeSlot,
  hasWon,
  insertAt,
  isPlacementCorrect,
  shuffle,
} from "./rules";
import type { Song } from "./types";

const song = (year: number): Song => ({
  id: String(year),
  title: `Nummer ${year}`,
  artist: "Test",
  year,
});

const timeline = [song(1970), song(1985), song(2000)];

describe("isPlacementCorrect", () => {
  it("accepteert een kaartje op de juiste plek", () => {
    expect(isPlacementCorrect(timeline, 0, song(1960))).toBe(true);
    expect(isPlacementCorrect(timeline, 1, song(1980))).toBe(true);
    expect(isPlacementCorrect(timeline, 2, song(1990))).toBe(true);
    expect(isPlacementCorrect(timeline, 3, song(2010))).toBe(true);
  });

  it("weigert een kaartje op de verkeerde plek", () => {
    expect(isPlacementCorrect(timeline, 0, song(1980))).toBe(false);
    expect(isPlacementCorrect(timeline, 1, song(1990))).toBe(false);
    expect(isPlacementCorrect(timeline, 3, song(1995))).toBe(false);
  });

  it("telt hetzelfde jaar als goed", () => {
    expect(isPlacementCorrect(timeline, 1, song(1970))).toBe(true);
    expect(isPlacementCorrect(timeline, 1, song(1985))).toBe(true);
  });

  it("werkt met een lege tijdlijn", () => {
    expect(isPlacementCorrect([], 0, song(1999))).toBe(true);
  });
});

describe("insertAt", () => {
  it("voegt toe zonder de originele tijdlijn te wijzigen", () => {
    const result = insertAt(timeline, 1, song(1980));
    expect(result.map((s) => s.year)).toEqual([1970, 1980, 1985, 2000]);
    expect(timeline).toHaveLength(3);
  });
});

describe("hasWon", () => {
  it("wint bij het doel aantal kaartjes", () => {
    expect(hasWon(timeline, 3)).toBe(true);
    expect(hasWon(timeline, 4)).toBe(false);
  });
});

describe("shuffle", () => {
  it("houdt alle kaartjes en laat het origineel ongemoeid", () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original);
    expect([...result].sort()).toEqual(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("describeSlot", () => {
  it("beschrijft de plek in gewone taal", () => {
    expect(describeSlot(timeline, 0)).toBe("vóór 1970");
    expect(describeSlot(timeline, 1)).toBe("tussen 1970 en 1985");
    expect(describeSlot(timeline, 3)).toBe("na 2000");
  });
});
