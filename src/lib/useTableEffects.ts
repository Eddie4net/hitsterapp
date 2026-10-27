"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Pulse } from "@/components/Ambient";
import type { GameView } from "@/net/useGameView";
import { playCue } from "./feedback";
import { resultMessage } from "./messages";

/**
 * Alles wat bij de tafel "gebeurt" maar niet getekend wordt: geluid, meldingen,
 * de HITSTER!-stempel, lichtflitsen, confetti en het scherm aanhouden.
 * De klassieke tafel en de 3D-tafel gebruiken dezelfde logica.
 */
export function useTableEffects(view: GameView) {
  const { state: g } = view;
  const [stampName, setStampName] = useState<string | null>(null);
  const [pulse, setPulse] = useState<Pulse>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [shuffling, setShuffling] = useState(false);

  // Bij een nieuw spel: de stapel wordt geschud. Alleen bij het openen van de tafel.
  // biome-ignore lint/correctness/useExhaustiveDependencies: bewust eenmalig
  useEffect(() => {
    const fresh =
      g.phase === "placing" && g.players.every((p) => p.timeline.length === 1);
    if (!fresh) return;
    setShuffling(true);
    playCue("shuffle");
    const t = setTimeout(() => setShuffling(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // Het scherm blijft aan tijdens het spel.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        // Niet elk apparaat staat dit toe; het spel werkt ook zonder.
      }
    };
    void request();
    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, []);

  // Uitkomst: kaartje draait om, licht flitst, geluid en melding.
  const resultKey = g.result?.song.id ?? null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: bewust alleen bij een nieuw resultaat
  useEffect(() => {
    const r = g.result;
    if (!r) return;
    const activeId = g.players[g.active].id;
    const message = resultMessage(r, g.players, activeId);
    const outcome: Exclude<Pulse, null> =
      r.winnerId === activeId ? "good" : r.winnerId !== null ? "steal" : "bad";
    playCue("flip");
    setPulse(outcome);
    setPulseKey((k) => k + 1);
    const t = setTimeout(() => {
      if (outcome === "bad") toast.error(message);
      else toast.success(message);
      playCue(
        outcome === "good"
          ? "correct"
          : outcome === "steal"
            ? "steal"
            : "wrong",
      );
    }, 450);
    return () => clearTimeout(t);
  }, [resultKey]);

  // Iemand roept HITSTER!: grote stempel op elk apparaat.
  const wasStealing = useRef(false);
  useEffect(() => {
    if (g.stealing && !wasStealing.current) {
      const name = g.players.find((p) => p.id === g.stealQueue[0])?.name;
      if (name) {
        setStampName(name);
        playCue("hitster");
      }
    }
    wasStealing.current = g.stealing;
  }, [g.stealing, g.players, g.stealQueue]);
  useEffect(() => {
    if (!stampName) return;
    const t = setTimeout(() => setStampName(null), 1300);
    return () => clearTimeout(t);
  }, [stampName]);

  // Munten rinkelen als er tokens veranderen.
  const tokenSignature = g.players.map((p) => p.tokens).join(",");
  const previousTokens = useRef(tokenSignature);
  useEffect(() => {
    if (previousTokens.current !== tokenSignature) playCue("coin");
    previousTokens.current = tokenSignature;
  }, [tokenSignature]);

  // Winnaar: fanfare en confetti.
  useEffect(() => {
    if (g.phase !== "finished") return;
    playCue("win");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void import("@tsparticles/confetti").then(({ confetti }) => {
      void confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
      setTimeout(
        () =>
          void confetti({
            particleCount: 90,
            angle: 60,
            spread: 70,
            origin: { x: 0, y: 0.7 },
          }),
        250,
      );
      setTimeout(
        () =>
          void confetti({
            particleCount: 90,
            angle: 120,
            spread: 70,
            origin: { x: 1, y: 0.7 },
          }),
        450,
      );
    });
  }, [g.phase]);

  return { stampName, pulse, pulseKey, shuffling };
}
