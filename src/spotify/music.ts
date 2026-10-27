import { create } from "zustand";
import { SAMPLE_SONGS } from "@/game/sampleSongs";
import type { Song } from "@/game/types";
import { getPlaylistSongs, SpotifyError } from "./api";
import { isLoggedIn } from "./auth";

/** Minimaal aantal nummers om een spel te kunnen spelen (startkaartjes + trekstapel). */
export const MIN_SONGS = 12;

export type PlaylistInfo = { id: string; name: string };

type MusicState = {
  source: "sample" | "spotify";
  playlist: PlaylistInfo | null;
  /** Nummers uit de gekozen playlist. */
  songs: Song[];
  status: "idle" | "loading" | "ready" | "error";
  progress: { loaded: number; total: number };
  skipped: number;
  error: string | null;
  loadPlaylist: (info: PlaylistInfo) => Promise<void>;
  chooseSample: () => void;
  /** Laadt de laatst gekozen playlist opnieuw, als je nog bent ingelogd. */
  restore: () => void;
};

const LAST_KEY = "hitster-last-playlist";

function rememberPlaylist(info: PlaylistInfo | null): void {
  try {
    if (info) window.localStorage.setItem(LAST_KEY, JSON.stringify(info));
    else window.localStorage.removeItem(LAST_KEY);
  } catch {
    // Onthouden lukt niet: je kiest dan de volgende keer opnieuw.
  }
}

export const useMusic = create<MusicState>((set, get) => ({
  source: "sample",
  playlist: null,
  songs: [],
  status: "idle",
  progress: { loaded: 0, total: 0 },
  skipped: 0,
  error: null,

  loadPlaylist: async (info) => {
    rememberPlaylist(info);
    set({
      source: "spotify",
      playlist: info,
      songs: [],
      status: "loading",
      progress: { loaded: 0, total: 0 },
      skipped: 0,
      error: null,
    });
    try {
      const loaded = await getPlaylistSongs(info.id, (loaded, total) =>
        set({ progress: { loaded, total } }),
      );
      set({ songs: loaded.songs, skipped: loaded.skipped, status: "ready" });
    } catch (e) {
      set({
        status: "error",
        error:
          e instanceof SpotifyError || e instanceof Error
            ? e.message
            : "De nummers ophalen is mislukt.",
      });
    }
  },

  restore: () => {
    if (get().source === "spotify" || !isLoggedIn()) return;
    try {
      const raw = window.localStorage.getItem(LAST_KEY);
      const info = raw ? (JSON.parse(raw) as PlaylistInfo) : null;
      if (info?.id) void get().loadPlaylist(info);
    } catch {
      // Geen of kapotte opgeslagen keuze: gewoon de voorbeeldnummers.
    }
  },

  chooseSample: () => {
    rememberPlaylist(null);
    set({
      source: "sample",
      playlist: null,
      songs: [],
      status: "idle",
      error: null,
      skipped: 0,
    });
  },
}));

/** De nummers waarmee het spel gespeeld wordt. */
export function activeSongs(): Song[] {
  const { source, songs } = useMusic.getState();
  return source === "spotify" ? songs : SAMPLE_SONGS;
}

/** Kan er gespeeld worden met de huidige keuze? */
export function musicReady(): boolean {
  const { source, status, songs } = useMusic.getState();
  return (
    source === "sample" || (status === "ready" && songs.length >= MIN_SONGS)
  );
}
