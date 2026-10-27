import type { Phase, Placement, Player, Result, Song } from "@/game/types";
import type { PublicState } from "./types";

/** Het deel van de spelstatus dat nodig is om een openbare weergave te maken. */
export type GameSnapshot = {
  phase: Phase;
  players: Player[];
  deck: Song[];
  current: Song | null;
  active: number;
  result: Result | null;
  winnerId: number | null;
  target: number;
  tokensEnabled: boolean;
  placements: Placement[];
  stealQueue: number[];
  stealing: boolean;
  bonusClaimed: boolean;
};

export type Presence = { remote: boolean; connected: boolean };

/** Zet de echte spelstatus om naar wat apparaten mogen zien (zonder geheim jaartal). */
export function toPublicState(
  game: GameSnapshot,
  presence: Presence[],
): PublicState {
  return {
    phase: game.phase === "setup" ? "placing" : game.phase,
    players: game.players.map((p) => ({
      id: p.id,
      name: p.name,
      timeline: p.timeline,
      tokens: p.tokens,
      remote: presence[p.id]?.remote ?? false,
      connected: presence[p.id]?.connected ?? true,
    })),
    deckCount: game.deck.length,
    currentId: game.current?.id ?? null,
    active: game.active,
    result: game.result,
    winnerId: game.winnerId,
    target: game.target,
    tokensEnabled: game.tokensEnabled,
    placements: game.placements,
    stealQueue: game.stealQueue,
    stealing: game.stealing,
    bonusClaimed: game.bonusClaimed,
  };
}
