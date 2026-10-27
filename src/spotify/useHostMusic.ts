"use client";

import { useEffect } from "react";
import { useGameStore } from "@/game/store";
import { disconnectPlayer, pausePlayback, playUri } from "./player";
import { stopBackgroundYearCheck } from "./years";

let pendingClose: ReturnType<typeof setTimeout> | null = null;

/**
 * Op het tafelscherm: speel automatisch het nummer van het kaartje dat nu geraden wordt,
 * net als de DJ bij het bordspel. Stopt als het spel afgelopen is of de tafel sluit.
 */
export function useHostMusic(
  active: boolean,
  currentId: string | null,
  finished: boolean,
) {
  useEffect(() => {
    if (!active || !currentId) return;
    const song = useGameStore.getState().current;
    if (song?.uri && song.id === currentId) void playUri(song.uri);
  }, [active, currentId]);

  useEffect(() => {
    if (active && finished) void pausePlayback();
  }, [active, finished]);

  useEffect(() => {
    // Direct weer actief (bijvoorbeeld bij een herstart in ontwikkelmodus): niet afsluiten.
    if (pendingClose) {
      clearTimeout(pendingClose);
      pendingClose = null;
    }
    return () => {
      stopBackgroundYearCheck();
      if (!active) return;
      // Even wachten: komt de tafel meteen terug, dan blijft de muziek gewoon doorspelen.
      pendingClose = setTimeout(() => {
        pendingClose = null;
        void pausePlayback();
        disconnectPlayer();
      }, 500);
    };
  }, [active]);
}
