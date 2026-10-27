"use client";

import { LogIn, MonitorSmartphone, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useSession } from "@/net/session";
import { Screen } from "./Screen";

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

export function Home({
  onLocal,
  onHost,
  onJoin,
}: {
  onLocal: () => void;
  onHost: () => void;
  onJoin: () => void;
}) {
  const error = useSession((s) => s.error);
  return (
    <Screen>
      <p className="mb-5 text-white/85">
        Luister naar een nummer en leg het kaartje op de juiste plek in je
        tijdlijn. Hoe wil je spelen?
      </p>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-950/80 px-4 py-3 text-sm font-semibold"
        >
          {error}
        </p>
      ) : null}

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
