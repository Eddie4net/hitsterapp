"use client";

import { ExternalLink, Pause, Play, RotateCcw, Wifi } from "lucide-react";
import { useGameStore } from "@/game/store";
import {
  connectPlayer,
  pausePlayback,
  restartPlayback,
  resumePlayback,
  usePlayer,
} from "@/spotify/player";

const BUTTON =
  "inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-950/80 px-4 text-sm font-semibold text-white hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Bediening van de muziek, alleen op het tafelscherm. De nummers starten vanzelf bij een
 * nieuw kaartje; deze knoppen zijn voor pauzeren, opnieuw horen en als de browser het
 * automatisch afspelen blokkeert.
 */
export function MusicControls() {
  const { status, error, playing } = usePlayer();
  const current = useGameStore((s) => s.current);

  if (status !== "ready") {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => void connectPlayer()}
          disabled={status === "connecting"}
          className={BUTTON}
        >
          <Wifi className="size-4" aria-hidden />
          {status === "connecting"
            ? "Verbinden met Spotify…"
            : "Muziek verbinden"}
        </button>
        {error ? (
          <p
            role="alert"
            className="max-w-sm rounded-xl bg-red-950/85 px-3 py-2 text-sm text-white"
          >
            {error}
          </p>
        ) : null}
        {error && current?.id ? (
          <a
            href={`https://open.spotify.com/track/${current.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-white underline"
          >
            Nummer zelf openen in Spotify
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void (playing ? pausePlayback() : resumePlayback())}
          className={BUTTON}
        >
          {playing ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
          {playing ? "Pauze" : "Afspelen"}
        </button>
        <button
          type="button"
          onClick={() => void restartPlayback()}
          className={BUTTON}
        >
          <RotateCcw className="size-4" aria-hidden />
          Opnieuw
        </button>
      </div>
      {error ? (
        <p
          role="alert"
          className="max-w-sm rounded-xl bg-red-950/85 px-3 py-2 text-sm text-white"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
