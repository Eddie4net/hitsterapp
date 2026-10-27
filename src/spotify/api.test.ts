import { describe, expect, it } from "vitest";
import {
  dedupeSongs,
  parsePlaylistId,
  songFromEntry,
  summarizePlaylist,
  yearFromRelease,
} from "./api";

const ID = "37i9dQZF1DXcBWIGoYBM5M";

describe("parsePlaylistId", () => {
  it("haalt de id uit een link, een uri of een kale id", () => {
    expect(
      parsePlaylistId(`https://open.spotify.com/playlist/${ID}?si=abc123`),
    ).toBe(ID);
    expect(
      parsePlaylistId(`https://open.spotify.com/intl-nl/playlist/${ID}`),
    ).toBe(ID);
    expect(parsePlaylistId(`spotify:playlist:${ID}`)).toBe(ID);
    expect(parsePlaylistId(`  ${ID}  `)).toBe(ID);
  });
  it("weigert dingen die geen playlist zijn", () => {
    expect(
      parsePlaylistId("https://open.spotify.com/track/abcdefghijklmnopqrstuv"),
    ).toBeNull();
    expect(parsePlaylistId("hallo")).toBeNull();
    expect(parsePlaylistId("")).toBeNull();
  });
});

describe("yearFromRelease", () => {
  it("leest jaar, maand-jaar en datum", () => {
    expect(yearFromRelease("1981")).toBe(1981);
    expect(yearFromRelease("1981-12")).toBe(1981);
    expect(yearFromRelease("1981-12-05")).toBe(1981);
  });
  it("geeft null bij onzin of een onmogelijk jaar", () => {
    expect(yearFromRelease(undefined)).toBeNull();
    expect(yearFromRelease("abcd")).toBeNull();
    expect(yearFromRelease("0000")).toBeNull();
  });
});

const track = (over: Record<string, unknown> = {}) => ({
  id: "t1",
  uri: "spotify:track:t1",
  name: "Africa",
  type: "track",
  is_local: false,
  is_playable: true,
  artists: [{ name: "Toto" }],
  album: { release_date: "1982-04-08" },
  ...over,
});

describe("songFromEntry", () => {
  it("maakt een kaartje van het nieuwe `item`-veld", () => {
    expect(songFromEntry({ item: track() })).toEqual({
      id: "t1",
      uri: "spotify:track:t1",
      title: "Africa",
      artist: "Toto",
      year: 1982,
      yearSource: "spotify",
    });
  });

  it("begrijpt ook het oude `track`-veld", () => {
    expect(songFromEntry({ track: track() })?.title).toBe("Africa");
  });

  it("voegt meerdere artiesten samen", () => {
    const song = songFromEntry({
      item: track({
        artists: [{ name: "Mark Ronson" }, { name: "Bruno Mars" }],
      }),
    });
    expect(song?.artist).toBe("Mark Ronson, Bruno Mars");
  });

  it.each([
    ["een lege regel", {}],
    ["een aflevering", { item: track({ type: "episode" }) }],
    ["een lokaal bestand", { item: track({ is_local: true }) }],
    ["een niet afspeelbaar nummer", { item: track({ is_playable: false }) }],
    ["een nummer zonder jaar", { item: track({ album: {} }) }],
    ["een nummer zonder id", { item: track({ id: null }) }],
  ])("slaat %s over", (_naam, entry) => {
    expect(songFromEntry(entry as never)).toBeNull();
  });
});

describe("dedupeSongs", () => {
  it("houdt hetzelfde nummer maar één keer, ook op een andere uitgave", () => {
    const base = { uri: "u", artist: "Queen", year: 1975 };
    const songs = dedupeSongs([
      { ...base, id: "a", title: "Bohemian Rhapsody" },
      { ...base, id: "b", title: "Bohemian Rhapsody" },
      { ...base, id: "a", title: "Iets anders" },
      { ...base, id: "c", title: "Don't Stop Me Now" },
    ]);
    expect(songs.map((s) => s.id)).toEqual(["a", "c"]);
  });
});

describe("summarizePlaylist", () => {
  const raw = {
    id: "p1",
    name: "Feest",
    images: [{ url: "https://i/x.jpg" }],
    owner: { id: "ik", display_name: "Ik" },
    collaborative: false,
  };
  it("leest het aantal uit `items` of het oude `tracks`", () => {
    expect(
      summarizePlaylist({ ...raw, items: { total: 42 } }, "ik").trackCount,
    ).toBe(42);
    expect(
      summarizePlaylist({ ...raw, tracks: { total: 7 } }, "ik").trackCount,
    ).toBe(7);
  });
  it("laat alleen eigen of gezamenlijke playlists toe", () => {
    expect(summarizePlaylist(raw, "ik").readable).toBe(true);
    expect(summarizePlaylist(raw, "iemand-anders").readable).toBe(false);
    expect(
      summarizePlaylist({ ...raw, collaborative: true }, "iemand-anders")
        .readable,
    ).toBe(true);
  });
});
