"use client";

import { useMemo } from "react";
import { useGameStore } from "@/game/store";
import { applyHostIntent } from "./intents";
import { toPublicState } from "./publicState";
import { useSession } from "./session";
import type { Intent, PublicState } from "./types";

/**
 * Eén vorm voor de tafel, of die nu op het tafelscherm, op een gedeeld apparaat
 * of op een telefoon draait. `me` is de speler van deze telefoon; `null` betekent
 * dat dit apparaat voor iedereen mag bedienen (tafelscherm of gedeeld apparaat).
 */
export type GameView = {
  state: PublicState;
  me: number | null;
  /** Code van het spel als je host bent of meedoet. */
  code: string | null;
  lost: boolean;
  act: (intent: Intent) => void;
  /** Stoppen (host of gedeeld apparaat) of het spel verlaten (telefoon). */
  exit: () => void;
};

export function useGameView(): GameView | null {
  const role = useSession((s) => s.role);
  const status = useSession((s) => s.status);
  const remote = useSession((s) => s.remote);
  const myPlayerId = useSession((s) => s.myPlayerId);
  const seats = useSession((s) => s.seats);
  const code = useSession((s) => s.code);
  const sendIntent = useSession((s) => s.sendIntent);
  const leave = useSession((s) => s.leave);
  const game = useGameStore();

  return useMemo(() => {
    if (role === "controller") {
      if (!remote) return null;
      return {
        state: remote,
        me: myPlayerId,
        code,
        lost: status === "lost",
        act: sendIntent,
        exit: leave,
      };
    }
    if (game.phase === "setup") return null;
    const now = Date.now();
    const presence =
      role === "host"
        ? seats.map((seat) => ({
            remote: seat.clientId !== null,
            connected: seat.clientId === null || now - seat.lastSeen < 12000,
          }))
        : [];
    return {
      state: toPublicState(game, presence),
      me: null,
      code: role === "host" ? code : null,
      lost: false,
      act: applyHostIntent,
      exit: role === "host" ? leave : game.reset,
    };
  }, [role, status, remote, myPlayerId, seats, code, sendIntent, leave, game]);
}
