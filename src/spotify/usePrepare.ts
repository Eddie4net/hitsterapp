"use client";

import { useRef, useState } from "react";
import { shuffle } from "@/game/rules";
import { SAMPLE_SONGS } from "@/game/sampleSongs";
import type { Song } from "@/game/types";
import { MIN_SONGS, useMusic } from "./music";
import { connectPlayer } from "./player";
import { checkFirstYears, startBackgroundYearCheck } from "./years";

export type Prepared = { songs: Song[]; preShuffled: boolean };

/**
 * Maakt de nummers klaar voor een nieuw spel: bij Spotify verbindt de speler en worden de
 * jaartallen van de eerste kaartjes gecontroleerd (dat duurt even, dus met voortgang).
 * Roep `prepare` aan vanuit een klik, zodat de browser het afspelen van geluid toestaat.
 */
export function usePrepare() {
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const abort = useRef<AbortController | null>(null);

  async function prepare(playerCount: number): Promise<Prepared | null> {
    const { source, songs } = useMusic.getState();
    if (source === "sample") return { songs: SAMPLE_SONGS, preShuffled: false };
    if (songs.length < MIN_SONGS) return null;

    // Direct de speler klaarzetten, terwijl de klik nog "vers" is.
    void connectPlayer();

    const controller = new AbortController();
    abort.current = controller;
    const first = 2 * playerCount + 3;
    setProgress({ done: 0, total: Math.min(first, songs.length) });
    const checked = await checkFirstYears(
      shuffle(songs),
      first,
      (done, total) => setProgress({ done, total }),
      controller.signal,
    );
    setProgress(null);
    return { songs: checked, preShuffled: true };
  }

  /** Sla de controle over: de jaartallen van Spotify worden dan gebruikt. */
  function skipCheck() {
    abort.current?.abort();
  }

  /** Aanroepen direct nadat het spel gestart is. */
  function afterStart() {
    startBackgroundYearCheck();
  }

  return { prepare, progress, skipCheck, afterStart };
}
