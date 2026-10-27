import type { Phase, Placement, Result, Song } from "@/game/types";

/**
 * Wat elk apparaat van het spel mag zien. Het huidige nummer is hier alleen een
 * id: jaar, titel en artiest komen pas mee in `result` zodra het kaartje omdraait.
 */
export type PublicPlayer = {
  id: number;
  name: string;
  timeline: Song[];
  tokens: number;
  /** Speelt op een eigen telefoon (en dus niet op het tafelscherm). */
  remote: boolean;
  connected: boolean;
};

export type PublicState = {
  phase: Exclude<Phase, "setup">;
  players: PublicPlayer[];
  deckCount: number;
  currentId: string | null;
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

/** Alles wat een speler kan doen. De host controleert of het mag. */
export type Intent =
  | { type: "place"; index: number }
  | { type: "beginSteal" }
  | { type: "stealAt"; index: number }
  | { type: "pass" }
  | { type: "skip" }
  | { type: "buy"; playerId?: number }
  | { type: "claimBonus" }
  | { type: "next" };

export type LobbyPlayer = {
  id: number;
  name: string;
  remote: boolean;
  connected: boolean;
};

export type LobbyState = {
  code: string;
  players: LobbyPlayer[];
  target: number;
  tokensEnabled: boolean;
};

export type RejectReason = "full" | "started" | "name";

/** Berichten tussen host (tafelscherm) en telefoons. */
export type Message =
  | { kind: "join"; clientId: string; name: string }
  | { kind: "welcome"; clientId: string; playerId: number }
  | { kind: "rejected"; clientId: string; reason: RejectReason }
  | { kind: "lobby"; lobby: LobbyState }
  | { kind: "state"; state: PublicState }
  | { kind: "intent"; clientId: string; intent: Intent }
  | { kind: "beat"; clientId: string }
  | { kind: "closed" };

export const MAX_PLAYERS = 4;
