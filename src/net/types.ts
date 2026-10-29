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
  /** Gekozen maar nog niet bevestigde plek van de speler aan de beurt. */
  pending: number | null;
  /** Gekozen maar nog niet bevestigde plek van de steler. */
  stealPending: number | null;
  /** Bedenktijd: resterende tijd op het moment van versturen, of null zonder lopende timer. */
  timer: { seconds: number; remainingMs: number } | null;
};

/** Alles wat een speler kan doen. De host controleert of het mag. */
export type Intent =
  | { type: "place"; index: number }
  | { type: "pick"; index: number }
  | { type: "confirm" }
  | { type: "stealPick"; index: number }
  | { type: "stealConfirm" }
  | { type: "beginSteal"; playerId?: number }
  | { type: "stealAt"; index: number }
  | { type: "pass"; playerId?: number }
  | { type: "passAll" }
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
  timerSeconds: number;
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
