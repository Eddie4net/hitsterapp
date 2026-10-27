/**
 * Nep-Spotify, alleen tijdens ontwikkelen (nooit in de live versie), om de schermen
 * te kunnen testen zonder in te loggen. Aanzetten: in de console van de browser
 * `localStorage.setItem("hitster-spotify-mock", "1")` en de pagina verversen.
 */
import { SAMPLE_SONGS } from "@/game/sampleSongs";

const ME = { id: "ik", display_name: "Test Gebruiker" };

function track(id: string, name: string, artist: string, year: number) {
  return {
    id,
    uri: `spotify:track:${id}`,
    name,
    type: "track",
    is_local: false,
    is_playable: true,
    artists: [{ name: artist }],
    album: { release_date: `${year}-06-01` },
  };
}

// Een paar heruitgaven, zodat de jaartalcontrole iets te doen heeft.
const REISSUES = [
  track("mock-r1", "Bohemian Rhapsody - Remastered 2011", "Queen", 2011),
  track("mock-r2", "Imagine - Remastered 2010", "John Lennon", 2010),
  track("mock-r3", "Billie Jean", "Michael Jackson", 2012),
];

const PARTY = [
  ...SAMPLE_SONGS.filter(
    (s) => !["Bohemian Rhapsody", "Imagine"].includes(s.title),
  ).map((s, i) => track(`mock-p${i}`, s.title, s.artist, s.year)),
  ...REISSUES,
  track("mock-x1", "Take On Me", "a-ha", 1985),
  track("mock-x2", "Sweet Dreams (Are Made of This)", "Eurythmics", 1983),
  track("mock-x3", "Livin' on a Prayer", "Bon Jovi", 1986),
];

const PLAYLISTS = [
  {
    id: "mock-party-aaaaaaaaaa",
    name: "Mijn feestmix",
    images: null,
    items: { total: PARTY.length },
    owner: ME,
    collaborative: false,
  },
  {
    id: "mock-samen-bbbbbbbbbb",
    name: "Samen luisteren",
    images: null,
    items: { total: 6 },
    owner: { id: "vriend", display_name: "Een vriend" },
    collaborative: true,
  },
  {
    id: "mock-top50-cccccccccc",
    name: "Top 50 Nederland",
    images: null,
    items: { total: 50 },
    owner: { id: "spotify", display_name: "Spotify" },
    collaborative: false,
  },
];

export async function mockGet(path: string): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 250));
  if (path === "/me") return ME;
  if (path.startsWith("/me/playlists")) {
    return { items: PLAYLISTS, next: null, total: PLAYLISTS.length };
  }
  const items = path.match(/^\/playlists\/([^/?]+)\/items/);
  if (items) {
    const id = items[1];
    if (id === "mock-party-aaaaaaaaaa") {
      return {
        items: PARTY.map((t) => ({ item: t })),
        next: null,
        total: PARTY.length,
      };
    }
    if (id === "mock-samen-bbbbbbbbbb") {
      const few = PARTY.slice(0, 6);
      return {
        items: few.map((t) => ({ item: t })),
        next: null,
        total: few.length,
      };
    }
    throw Object.assign(new Error("403"), { status: 403 });
  }
  const meta = path.match(/^\/playlists\/([^/?]+)$/);
  if (meta) {
    const found = PLAYLISTS.find((p) => p.id === meta[1]);
    if (found) return found;
  }
  throw Object.assign(new Error("404"), { status: 404 });
}
