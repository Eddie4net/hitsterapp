"use client";

import { Music2 } from "lucide-react";
import { MIN_SONGS, useMusic } from "@/spotify/music";

/** Waarom kan er nu nog niet gestart worden met de gekozen muziek? Null als het kan. */
export function musicBlock(): string | null {
  const { source, status, songs, error } = useMusic.getState();
  if (source === "sample") return null;
  if (status === "loading")
    return "De nummers worden nog opgehaald. Even geduld.";
  if (status === "error") return error ?? "De nummers ophalen is mislukt.";
  if (songs.length < MIN_SONGS) {
    return `Er zijn te weinig nummers: je hebt er minimaal ${MIN_SONGS} nodig.`;
  }
  return null;
}

/** Korte regel met de gekozen muziek (wijzigen kan op het beginscherm). */
export function MusicSummary() {
  const { source, playlist, songs, status } = useMusic();
  return (
    <p className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/85">
      <Music2 className="mr-2 inline size-4 text-gold" aria-hidden />
      {source === "spotify" ? (
        <>
          <strong>{playlist?.name}</strong>
          {status === "ready" ? ` · ${songs.length} nummers` : ""}
          {status === "loading" ? " · ophalen…" : ""}
        </>
      ) : (
        <>
          Voorbeeldnummers, zonder geluid. Kies je eigen playlist op het
          beginscherm.
        </>
      )}
    </p>
  );
}

/** Voortgang van de jaartalcontrole bij het starten. */
export function PrepareStatus({
  progress,
  onSkip,
}: {
  progress: { done: number; total: number } | null;
  onSkip: () => void;
}) {
  if (!progress) return null;
  return (
    <div className="mt-3 rounded-xl bg-white/10 p-3 text-sm" aria-live="polite">
      <p className="font-semibold">
        Jaartallen controleren… {progress.done} van {progress.total}
      </p>
      <p className="mt-1 text-white/75">
        Spotify noemt bij heruitgaven vaak het jaar van de nieuwe uitgave. We
        zoeken het oorspronkelijke jaar op.
      </p>
      <progress
        className="mt-2 h-2 w-full"
        value={progress.done}
        max={Math.max(progress.total, 1)}
      />
      <button
        type="button"
        onClick={onSkip}
        className="mt-2 text-xs text-white/80 underline"
      >
        Overslaan en de jaartallen van Spotify gebruiken
      </button>
    </div>
  );
}
