"use client";

import { LogIn, MonitorSmartphone, Music2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useSession } from "@/net/session";
import { useMusic } from "@/spotify/music";
import { Screen, SECONDARY_BUTTON } from "./Screen";

function Option({
  icon,
  title,
  text,
  badge,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition hover:border-gold hover:bg-white/10"
    >
      <span className="mt-0.5 text-gold">{icon}</span>
      <span className="flex-1">
        <span className="flex flex-wrap items-center gap-2 text-lg font-bold">
          {title}
          {badge ? (
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-black">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-sm text-white/75">{text}</span>
      </span>
    </button>
  );
}

/** Welke muziek is er gekozen? Hier kies je ook je eigen Spotify-playlist. */
function MusicRow({ onMusic }: { onMusic: () => void }) {
  const { source, playlist, status, songs } = useMusic();
  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3">
      <Music2 className="size-6 shrink-0 text-gold" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Muziek</p>
        <p className="truncate text-white/75">
          {source === "spotify" ? (
            <>
              {playlist?.name}
              {status === "ready" ? ` · ${songs.length} nummers` : ""}
              {status === "loading" ? " · ophalen…" : ""}
              {status === "error" ? " · mislukt" : ""}
            </>
          ) : (
            "Voorbeeldnummers, zonder geluid"
          )}
        </p>
      </div>
      <button type="button" onClick={onMusic} className={SECONDARY_BUTTON}>
        {source === "spotify" ? "Wijzigen" : "Spotify koppelen"}
      </button>
    </div>
  );
}

export function Home({
  onLocal,
  onHost,
  onJoin,
  onMusic,
  notice,
}: {
  onLocal: () => void;
  onHost: () => void;
  onJoin: () => void;
  onMusic: () => void;
  notice?: string | null;
}) {
  const error = useSession((s) => s.error);
  return (
    <Screen>
      <p className="mb-5 text-white/85">
        Luister naar een nummer en leg het kaartje op de juiste plek in je
        tijdlijn. Hoe wil je spelen?
      </p>

      {notice ? (
        <output className="mb-4 block rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold">
          {notice}
        </output>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-950/80 px-4 py-3 text-sm font-semibold"
        >
          {error}
        </p>
      ) : null}

      <MusicRow onMusic={onMusic} />

      <div className="space-y-3">
        <Option
          icon={<MonitorSmartphone className="size-7" aria-hidden />}
          title="Tafelscherm + telefoons"
          badge="Aanbevolen"
          text="Eén groot scherm (laptop, tablet of tv) is de tafel en speelt de muziek. Iedereen doet mee met de eigen telefoon."
          onClick={onHost}
        />
        <Option
          icon={<Users className="size-7" aria-hidden />}
          title="Op één apparaat"
          text="Je geeft één telefoon of tablet door. Geen verbinding nodig."
          onClick={onLocal}
        />
        <Option
          icon={<LogIn className="size-7" aria-hidden />}
          title="Meedoen met een spel"
          text="Heeft iemand anders een tafelscherm gestart? Voer de code in of scan de QR-code."
          onClick={onJoin}
        />
      </div>
    </Screen>
  );
}
