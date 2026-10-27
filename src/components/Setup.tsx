"use client";

import { Disc3 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { OFFICIAL_TARGET, START_TOKENS } from "@/game/rules";
import { useGameStore } from "@/game/store";
import { SoundToggle } from "./SoundToggle";

const PLAYER_OPTIONS = [2, 3, 4];
const TARGET_OPTIONS = [
  { value: 5, label: "Kort spel", hint: "5 kaartjes" },
  { value: OFFICIAL_TARGET, label: "Officieel", hint: "10 kaartjes" },
];

const nameSchema = z
  .string()
  .trim()
  .min(1, "Vul een naam in.")
  .max(16, "Maximaal 16 tekens.");

/** Geeft per speler een foutmelding (of undefined als de naam goed is). */
function validateNames(names: string[]): (string | undefined)[] {
  return names.map((raw, i) => {
    const parsed = nameSchema.safeParse(raw);
    if (!parsed.success) return parsed.error.issues[0]?.message;
    const lower = parsed.data.toLowerCase();
    const first = names.findIndex((n) => n.trim().toLowerCase() === lower);
    return first !== i ? "Deze naam is al gebruikt." : undefined;
  });
}

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
  const [names, setNames] = useState([
    "Speler 1",
    "Speler 2",
    "Speler 3",
    "Speler 4",
  ]);
  const [errors, setErrors] = useState<(string | undefined)[]>([]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const active = names.slice(0, count);
    const found = validateNames(active);
    setErrors(found);
    if (found.some(Boolean)) return;
    start(
      active.map((n) => n.trim()),
      target,
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center floor p-4">
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-md rounded-3xl border border-white/10 bg-stone-950/90 p-6 shadow-2xl backdrop-blur sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Disc3 className="size-10 text-gold" aria-hidden />
            <h1 className="text-3xl font-black tracking-tight">Hitsterapp</h1>
          </div>
          <SoundToggle />
        </div>
        <p className="mb-6 text-white/80">
          Luister naar een nummer en leg het kaartje op de juiste plek in je
          tijdlijn. Wie het eerst genoeg kaartjes heeft, wint. Je begint met{" "}
          {START_TOKENS} tokens.
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

        <fieldset className="mb-5 space-y-3">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
            Namen
          </legend>
          {names.slice(0, count).map((name, i) => {
            const id = `name-${i}`;
            const error = errors[i];
            return (
              <div key={id}>
                <label
                  htmlFor={id}
                  className="mb-1 block text-sm text-white/80"
                >
                  Speler {i + 1}
                </label>
                <input
                  id={id}
                  value={name}
                  maxLength={32}
                  autoComplete="off"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  onChange={(e) =>
                    setNames((prev) =>
                      prev.map((n, j) => (j === i ? e.target.value : n)),
                    )
                  }
                  className="min-h-12 w-full rounded-xl border border-white/25 bg-white/5 px-4 text-white placeholder:text-white/50"
                />
                {error ? (
                  <p id={`${id}-error`} className="mt-1 text-sm text-red-300">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
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
          type="submit"
          className="min-h-12 w-full rounded-xl bg-gold px-6 py-3 text-lg font-bold text-black transition hover:brightness-110"
        >
          Start het spel
        </button>

        <p className="mt-4 text-sm text-white/60">
          Voorlopig met voorbeeldnummers. De Spotify-koppeling komt in de
          volgende stap.
        </p>
      </form>
    </main>
  );
}
