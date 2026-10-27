"use client";

import { Disc3 } from "lucide-react";
import { useState } from "react";
import { OFFICIAL_TARGET } from "@/game/rules";
import { useGameStore } from "@/game/store";

const PLAYER_OPTIONS = [2, 3, 4];
const TARGET_OPTIONS = [
  { value: 5, label: "Kort spel", hint: "5 kaartjes" },
  { value: OFFICIAL_TARGET, label: "Officieel", hint: "10 kaartjes" },
];

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-12 rounded-xl border px-5 py-2 text-left font-medium transition-colors ${
        selected
          ? "border-gold bg-gold text-black"
          : "border-white/25 bg-white/5 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export function Setup() {
  const start = useGameStore((s) => s.start);
  const [count, setCount] = useState(2);
  const [target, setTarget] = useState(5);

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_top,#14503c,#0b1210_70%)] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Disc3 className="size-10 text-gold" aria-hidden />
          <h1 className="text-3xl font-black tracking-tight">Hitsterapp</h1>
        </div>
        <p className="mb-6 text-white/80">
          Luister naar een nummer en leg het kaartje op de juiste plek in je
          tijdlijn. Wie het eerst genoeg kaartjes heeft, wint.
        </p>

        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
            Aantal spelers
          </legend>
          <div className="flex gap-2">
            {PLAYER_OPTIONS.map((n) => (
              <Choice
                key={n}
                selected={count === n}
                onClick={() => setCount(n)}
              >
                {n}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-8">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
            Spelduur
          </legend>
          <div className="flex flex-wrap gap-2">
            {TARGET_OPTIONS.map((o) => (
              <Choice
                key={o.value}
                selected={target === o.value}
                onClick={() => setTarget(o.value)}
              >
                {o.label}
                <span className="block text-sm font-normal opacity-80">
                  {o.hint}
                </span>
              </Choice>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={() =>
            start(
              Array.from({ length: count }, (_, i) => `Speler ${i + 1}`),
              target,
            )
          }
          className="min-h-12 w-full rounded-xl bg-gold px-6 py-3 text-lg font-bold text-black transition hover:brightness-110"
        >
          Start het spel
        </button>

        <p className="mt-4 text-sm text-white/60">
          Voorlopig met voorbeeldnummers. De Spotify-koppeling komt in de
          volgende stap.
        </p>
      </div>
    </main>
  );
}
