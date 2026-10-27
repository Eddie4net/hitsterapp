import { describe, expect, it } from "vitest";
import { cleanTitle, combineYears, type MbRecording, pickYear } from "./year";

describe("cleanTitle", () => {
  it.each([
    ["Bohemian Rhapsody - Remastered 2011", "Bohemian Rhapsody"],
    ["Imagine - 2010 Remaster", "Imagine"],
    ["Africa - Single Version", "Africa"],
    ["Hey Jude (Remastered 2015)", "Hey Jude"],
    ["Uptown Funk (feat. Bruno Mars)", "Uptown Funk"],
    ["Mr. Brightside", "Mr. Brightside"],
    ["Don't Stop Believin'", "Don't Stop Believin'"],
  ])("maakt %s tot %s", (input, expected) => {
    expect(cleanTitle(input)).toBe(expected);
  });
});

const rec = (
  title: string,
  artist: string,
  date: string | undefined,
  extra: Partial<MbRecording> = {},
): MbRecording => ({
  title,
  score: 100,
  "first-release-date": date,
  "artist-credit": [{ name: artist }],
  ...extra,
});

describe("pickYear", () => {
  it("kiest het vroegste jaar van de juiste opname", () => {
    const year = pickYear(
      [
        rec("Bohemian Rhapsody", "Queen", "2011-01-01"),
        rec("Bohemian Rhapsody", "Queen", "1975-10-31"),
        rec("Bohemian Rhapsody", "Queen", "1991-05-01"),
      ],
      "Bohemian Rhapsody - Remastered 2011",
      "Queen",
    );
    expect(year).toBe(1975);
  });

  it("negeert andere artiesten, live-opnames en lage scores", () => {
    const year = pickYear(
      [
        rec("Imagine", "Some Cover Band", "1980"),
        rec("Imagine", "John Lennon", "1971", { score: 40 }),
        rec("Imagine", "John Lennon", "1972", { disambiguation: "live" }),
        rec("Imagine", "John Lennon", "1971-10-11"),
      ],
      "Imagine",
      "John Lennon",
    );
    expect(year).toBe(1971);
  });

  it("zoekt op de eerste artiest bij een samenwerking", () => {
    const year = pickYear(
      [rec("Uptown Funk", "Mark Ronson", "2014-11-10")],
      "Uptown Funk",
      "Mark Ronson, Bruno Mars",
    );
    expect(year).toBe(2014);
  });

  it("geeft null zonder betrouwbare match", () => {
    expect(pickYear([], "X", "Y")).toBeNull();
    expect(pickYear([rec("Iets anders", "Y", "1990")], "X", "Y")).toBeNull();
    expect(pickYear([rec("X", "Y", undefined)], "X", "Y")).toBeNull();
  });
});

describe("combineYears", () => {
  it("neemt het eerdere jaar van MusicBrainz", () => {
    expect(combineYears(2011, 1975)).toEqual({
      year: 1975,
      source: "musicbrainz",
    });
  });
  it("houdt Spotify aan als MusicBrainz later is of niets weet", () => {
    expect(combineYears(1975, 1990)).toEqual({ year: 1975, source: "spotify" });
    expect(combineYears(1975, null)).toEqual({ year: 1975, source: "spotify" });
  });
  it("markeert een bevestigd jaar", () => {
    expect(combineYears(1975, 1975)).toEqual({
      year: 1975,
      source: "musicbrainz",
    });
  });
});

import { type MbReleaseGroup, pickYearFromGroups } from "./year";

describe("pickYearFromGroups", () => {
  const group = (
    title: string,
    artist: string,
    date: string,
    extra: Partial<MbReleaseGroup> = {},
  ): MbReleaseGroup => ({
    title,
    score: 100,
    "first-release-date": date,
    "artist-credit": [{ name: artist }],
    ...extra,
  });

  it("kiest het vroegste jaar van de echte uitgaven", () => {
    expect(
      pickYearFromGroups(
        [
          group("Imagine", "John Lennon", "1988"),
          group("Imagine", "John Lennon", "1971-10-11"),
          group("Imagine", "John Lennon", "1975"),
        ],
        "Imagine - Remastered 2010",
        "John Lennon",
      ),
    ).toBe(1971);
  });

  it("negeert live-uitgaven, andere artiesten en lage scores", () => {
    expect(
      pickYearFromGroups(
        [
          group("Africa", "Toto", "1990", { "secondary-types": ["Live"] }),
          group("Africa", "Weezer", "2018"),
          group("Africa", "Toto", "1970", { score: 50 }),
          group("Africa", "Toto", "1982-04-08"),
        ],
        "Africa",
        "Toto",
      ),
    ).toBe(1982);
  });

  it("geeft null als er niets bruikbaars is", () => {
    expect(pickYearFromGroups([], "X", "Y")).toBeNull();
  });
});
