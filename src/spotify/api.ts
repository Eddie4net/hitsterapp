import type { Song } from "@/game/types";
import { getAccessToken } from "./auth";
import { isMock } from "./config";
import { mockGet } from "./mock";

const API = "https://api.spotify.com/v1";

export class SpotifyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function friendly(status: number, detail: string | undefined): string {
  if (status === 401) return "Je bent niet (meer) ingelogd bij Spotify.";
  if (status === 403) {
    return "Spotify geeft hier geen toegang toe. In ontwikkelmodus kun je alleen de nummers van playlists ophalen die van jou zijn of waaraan je meewerkt, en moet je account bij de toegestane gebruikers staan (Spotify Dashboard, Users management).";
  }
  if (status === 404) return "Die playlist bestaat niet of is niet te vinden.";
  return detail ?? `Spotify gaf een fout (${status}).`;
}

async function get<T>(pathOrUrl: string): Promise<T> {
  if (isMock()) {
    try {
      return (await mockGet(pathOrUrl)) as T;
    } catch (e) {
      const status = (e as { status?: number }).status ?? 500;
      throw new SpotifyError(status, friendly(status, undefined));
    }
  }
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : API + pathOrUrl;
  let token = await getAccessToken();
  if (!token) throw new SpotifyError(401, friendly(401, undefined));
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 429) {
      const wait = Number(response.headers.get("Retry-After") ?? "1");
      await sleep(Math.min(Math.max(wait, 1), 10) * 1000);
      continue;
    }
    if (response.status === 401 && attempt === 0) {
      token = await getAccessToken(true);
      if (!token) throw new SpotifyError(401, friendly(401, undefined));
      continue;
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      throw new SpotifyError(
        response.status,
        friendly(response.status, body?.error?.message),
      );
    }
    return (await response.json()) as T;
  }
  throw new SpotifyError(
    429,
    "Spotify is even druk. Probeer het over een minuut opnieuw.",
  );
}

type Paging<T> = { items: T[]; next: string | null; total: number };

export type Me = { id: string; displayName: string };

export async function getMe(): Promise<Me> {
  const me = await get<{ id: string; display_name?: string | null }>("/me");
  return { id: me.id, displayName: me.display_name || me.id };
}

export type PlaylistSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerId: string;
  ownerName: string;
  collaborative: boolean;
  /** In ontwikkelmodus mag je alleen eigen of gezamenlijke playlists uitlezen. */
  readable: boolean;
};

type RawPlaylist = {
  id: string;
  name: string;
  images?: { url: string }[] | null;
  // Spotify hernoemde `tracks` naar `items`; we begrijpen allebei.
  items?: { total?: number } | null;
  tracks?: { total?: number } | null;
  owner?: { id: string; display_name?: string | null };
  collaborative?: boolean;
};

export function summarizePlaylist(
  raw: RawPlaylist,
  meId: string,
): PlaylistSummary {
  const ownerId = raw.owner?.id ?? "";
  const collaborative = Boolean(raw.collaborative);
  return {
    id: raw.id,
    name: raw.name,
    imageUrl: raw.images?.[0]?.url ?? null,
    trackCount: raw.items?.total ?? raw.tracks?.total ?? 0,
    ownerId,
    ownerName: raw.owner?.display_name || ownerId,
    collaborative,
    readable: ownerId === meId || collaborative,
  };
}

export async function listMyPlaylists(
  meId: string,
): Promise<PlaylistSummary[]> {
  const all: PlaylistSummary[] = [];
  let next: string | null = "/me/playlists?limit=50";
  while (next && all.length < 300) {
    const page: Paging<RawPlaylist | null> = await get(next);
    for (const raw of page.items)
      if (raw) all.push(summarizePlaylist(raw, meId));
    next = page.next;
  }
  return all;
}

export async function getPlaylist(
  id: string,
  meId: string,
): Promise<PlaylistSummary> {
  return summarizePlaylist(await get<RawPlaylist>(`/playlists/${id}`), meId);
}

/** Haalt de id uit een Spotify-link, een spotify:playlist:-code of een kale id. */
export function parsePlaylistId(input: string): string | null {
  const text = input.trim();
  const fromUrl = text.match(/playlist\/([A-Za-z0-9]{22})/);
  if (fromUrl) return fromUrl[1];
  const fromUri = text.match(/^spotify:playlist:([A-Za-z0-9]{22})$/);
  if (fromUri) return fromUri[1];
  if (/^[A-Za-z0-9]{22}$/.test(text)) return text;
  return null;
}

type RawTrack = {
  id?: string | null;
  uri?: string;
  name?: string;
  type?: string;
  is_local?: boolean;
  is_playable?: boolean;
  artists?: { name: string }[];
  album?: { release_date?: string };
};
type RawEntry = {
  item?: RawTrack | null;
  track?: RawTrack | null;
  is_local?: boolean;
};

/** "1981-12" of "1981" wordt 1981. */
export function yearFromRelease(date: string | undefined): number | null {
  const year = Number.parseInt(date?.slice(0, 4) ?? "", 10);
  return Number.isFinite(year) && year >= 1900 && year <= 2100 ? year : null;
}

/** Zet één regel uit een playlist om in een kaartje, of null als hij niet bruikbaar is. */
export function songFromEntry(entry: RawEntry): Song | null {
  // Spotify noemt het nu `item`; het oude `track` begrijpen we ook.
  const t = entry.item ?? entry.track;
  if (!t || t.type !== "track" || t.is_local || entry.is_local) return null;
  if (t.is_playable === false || !t.id || !t.uri || !t.name) return null;
  const year = yearFromRelease(t.album?.release_date);
  if (year === null) return null;
  return {
    id: t.id,
    uri: t.uri,
    title: t.name,
    artist: (t.artists ?? []).map((a) => a.name).join(", ") || "Onbekend",
    year,
    yearSource: "spotify",
  };
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Dezelfde nummers (ook twee keer toegevoegd of op een andere uitgave) maar één keer. */
export function dedupeSongs(songs: Song[]): Song[] {
  const seen = new Set<string>();
  const out: Song[] = [];
  for (const s of songs) {
    const key = `${normalize(s.title)}|${normalize(s.artist)}`;
    if (seen.has(s.id) || seen.has(key)) continue;
    seen.add(s.id);
    seen.add(key);
    out.push(s);
  }
  return out;
}

export type LoadedPlaylist = { songs: Song[]; total: number; skipped: number };

export async function getPlaylistSongs(
  id: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<LoadedPlaylist> {
  const raw: Song[] = [];
  let total = 0;
  let skipped = 0;
  let next: string | null = `/playlists/${id}/items?limit=50&offset=0`;
  while (next) {
    const page: Paging<RawEntry> = await get(next);
    total = page.total;
    for (const entry of page.items) {
      const song = songFromEntry(entry);
      if (song) raw.push(song);
      else skipped++;
    }
    onProgress?.(raw.length + skipped, total);
    next = page.next;
  }
  const songs = dedupeSongs(raw);
  return { songs, total, skipped: skipped + (raw.length - songs.length) };
}
