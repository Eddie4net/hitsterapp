"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { OFFICIAL_TARGET, START_TOKENS } from "@/game/rules";
import { useGameStore } from "@/game/store";
import {
  Choice,
  FieldLabel,
  PRIMARY_BUTTON,
  Screen,
  SECONDARY_BUTTON,
} from "./Screen";

const PLAYER_OPTIONS = [2, 3, 4];
export const TARGET_OPTIONS = [
  { value: 5, label: "Kort spel", hint: "5 kaartjes" },
  { value: OFFICIAL_TARGET, label: "Officieel", hint: "10 kaartjes" },
];
const NAMES_KEY = "hitsterapp-names";

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Vul een naam in.")
  .max(16, "Maximaal 16 tekens.");

/** Geeft per speler een foutmelding (of undefined als de naam goed is). */
export function validateNames(names: string[]): (string | undefined)[] {
  return names.map((raw, i) => {
    const parsed = nameSchema.safeParse(raw);
    if (!parsed.success) return parsed.error.issues[0]?.message;
    const lower = parsed.data.toLowerCase();
    const first = names.findIndex((n) => n.trim().toLowerCase() === lower);
    return first !== i ? "Deze naam is al gebruikt." : undefined;
  });
}

/** Opzet voor één gedeeld apparaat. */
export function Setup({ onBack }: { onBack: () => void }) {
  const start = useGameStore((s) => s.start);
  const [count, setCount] = useState(2);
  const [target, setTarget] = useState(5);
  const [tokens, setTokens] = useState(true);
  const [names, setNames] = useState([
    "Speler 1",
    "Speler 2",
    "Speler 3",
    "Speler 4",
  ]);
  const [errors, setErrors] = useState<(string | undefined)[]>([]);

  // Onthoud de laatst gebruikte namen.
  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(NAMES_KEY) ?? "null",
      );
      if (Array.isArray(saved) && saved.length === 4)
        setNames(saved.map(String));
    } catch {
      // Geen opgeslagen namen of opslag niet beschikbaar: de standaardnamen blijven staan.
    }
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const active = names.slice(0, count);
    const found = validateNames(active);
    setErrors(found);
    if (found.some(Boolean)) return;
    try {
      window.localStorage.setItem(NAMES_KEY, JSON.stringify(names));
    } catch {
      // Opslaan mislukt: niet erg.
    }
    start(
      active.map((n) => n.trim()),
      target,
      tokens,
    );
  }

  return (
    <Screen>
      <form onSubmit={submit} noValidate>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Terug
        </button>

        <fieldset className="mb-5">
          <legend>
            <FieldLabel>Aantal spelers</FieldLabel>
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
          <legend>
            <FieldLabel>Namen</FieldLabel>
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

        <fieldset className="mb-5">
          <legend>
            <FieldLabel>Spelduur</FieldLabel>
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

        <fieldset className="mb-8">
          <legend>
            <FieldLabel>Tokens</FieldLabel>
          </legend>
          <div className="flex flex-wrap gap-2">
            <Choice selected={tokens} onClick={() => setTokens(true)}>
              Met tokens
              <span className="block text-sm font-normal opacity-80">
                Officieel: {START_TOKENS} per speler
              </span>
            </Choice>
            <Choice selected={!tokens} onClick={() => setTokens(false)}>
              Zonder tokens
              <span className="block text-sm font-normal opacity-80">
                Alleen kaartjes leggen
              </span>
            </Choice>
          </div>
        </fieldset>

        <button type="submit" className={PRIMARY_BUTTON}>
          Start het spel
        </button>
        <button
          type="button"
          onClick={onBack}
          className={`${SECONDARY_BUTTON} mt-3 w-full`}
        >
          Annuleren
        </button>

        <p className="mt-4 text-sm text-white/60">
          Voorlopig met voorbeeldnummers. De Spotify-koppeling komt in de
          volgende stap.
        </p>
      </form>
    </Screen>
  );
}
