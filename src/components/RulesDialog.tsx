"use client";

import { BookOpen } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  BUY_COST,
  MAX_TOKENS,
  OFFICIAL_TARGET,
  START_TOKENS,
} from "@/game/rules";

const SEEN_KEY = "hitsterapp-rules-seen";

/** Knop met de officiële spelregels. Opent bij het eerste spel vanzelf, daarna alleen op verzoek. */
export function RulesButton({
  autoOpenOnce = false,
}: {
  autoOpenOnce?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!autoOpenOnce) return;
    try {
      if (window.localStorage.getItem(SEEN_KEY) === "1") return;
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Zonder opslag tonen we de regels gewoon elke keer.
    }
    ref.current?.showModal();
  }, [autoOpenOnce]);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-label="Spelregels"
        className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-white/85 hover:bg-white/10"
      >
        <BookOpen className="size-4" aria-hidden />
        <span className="hidden sm:inline">Spelregels</span>
      </button>

      <dialog
        ref={ref}
        aria-labelledby="rules-title"
        className="m-auto max-h-[88dvh] w-[min(92vw,42rem)] overflow-y-auto rounded-3xl bg-stone-900 p-6 text-white ring-2 ring-gold backdrop:bg-black/75 sm:p-8"
      >
        <h2
          id="rules-title"
          tabIndex={-1}
          // biome-ignore lint/a11y/noAutofocus: de dialoog begint bij de titel, niet bij de knop onderaan
          autoFocus
          className="text-2xl font-black outline-none"
        >
          Spelregels
        </h2>
        <p className="mt-1 text-sm text-white/70">
          Gebaseerd op de officiële Hitster-regels (hitstergame.com).
        </p>

        <div className="mt-5 space-y-5 text-[15px] leading-relaxed text-white/90">
          <section>
            <h3 className="font-bold text-gold">Doel</h3>
            <p>
              Wie als eerste {OFFICIAL_TARGET} kaartjes goed in de eigen
              tijdlijn heeft liggen, wint.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-gold">Start</h3>
            <p>
              Iedereen begint met één kaartje in de tijdlijn en {START_TOKENS}{" "}
              tokens. Wie het oudste kaartje trekt, begint. Daarna gaat het de
              tafel rond.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-gold">Jouw beurt</h3>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Luister naar het nummer.</li>
              <li>
                Leg het kaartje vóór, ná of tússen de kaartjes in je tijdlijn.
              </li>
              <li>
                Het kaartje draait om. Klopt de plek, dan blijft het liggen. Zo
                niet, dan gaat het weg. Hetzelfde jaar als een buurkaartje telt
                als goed.
              </li>
            </ol>
          </section>
          <section>
            <h3 className="font-bold text-gold">Tokens</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Overslaan:</strong> geef in je eigen beurt 1 token uit
                en krijg een nieuw nummer.
              </li>
              <li>
                <strong>SPOT-ON! (stelen):</strong> denk je dat de speler aan de
                beurt het fout heeft? Geef 1 token uit en kies een andere plek
                in die tijdlijn. Heb jij het goed en de ander fout, dan krijg
                jij het kaartje in je eigen tijdlijn. Heb jij het fout, dan ben
                je je token kwijt. Twee tokens kunnen niet op dezelfde plek.
              </li>
              <li>
                <strong>Verdienen:</strong> noem in je eigen beurt de artiest én
                de titel goed en je krijgt 1 token, ook als je kaartje verkeerd
                ligt. Je hebt nooit meer dan {MAX_TOKENS} tokens.
              </li>
              <li>
                <strong>Kopen:</strong> wissel op elk moment {BUY_COST} tokens
                in voor een kaartje uit de stapel. Het komt direct in je
                tijdlijn, zonder gokken.
              </li>
            </ul>
          </section>
        </div>

        <form method="dialog" className="mt-6">
          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-gold px-6 font-bold text-black hover:brightness-110"
          >
            Begrepen
          </button>
        </form>
      </dialog>
    </>
  );
}
