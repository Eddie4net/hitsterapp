import { useGameStore } from "@/game/store";
import type { Intent } from "./types";

/**
 * Voer de keuze van een speler uit, maar alleen als die speler nu aan de beurt
 * is voor die handeling. Geeft terug of het gelukt is.
 */
export function applyPlayerIntent(playerId: number, intent: Intent): boolean {
  const s = useGameStore.getState();
  const activeId = s.players[s.active]?.id;
  const isActive = activeId === playerId;
  const isStealer = s.stealQueue[0] === playerId;
  const slotCount = (s.players[s.active]?.timeline.length ?? 0) + 1;
  const validSlot = (index: number) =>
    Number.isInteger(index) && index >= 0 && index < slotCount;

  switch (intent.type) {
    case "place":
      if (s.phase !== "placing" || !isActive || !validSlot(intent.index)) {
        return false;
      }
      s.place(intent.index);
      return true;
    case "skip":
      if (s.phase !== "placing" || !isActive) return false;
      s.skip();
      return true;
    case "claimBonus":
      if (s.phase !== "reveal" || !isActive) return false;
      s.claimBonus();
      return true;
    case "next":
      if (s.phase !== "reveal" || !isActive) return false;
      s.next();
      return true;
    case "beginSteal":
      if (s.phase !== "steal" || !isStealer) return false;
      s.beginSteal();
      return true;
    case "stealAt":
      if (
        s.phase !== "steal" ||
        !s.stealing ||
        !isStealer ||
        !validSlot(intent.index)
      ) {
        return false;
      }
      s.stealAt(intent.index);
      return true;
    case "pass":
      if (s.phase !== "steal" || !isStealer) return false;
      s.pass();
      return true;
    case "buy":
      // Een telefoon kan alleen voor zichzelf kopen.
      s.buy(playerId);
      return true;
  }
}

/** Het tafelscherm zelf (of één gedeeld apparaat) mag alles, de spelregels bewaken de rest. */
export function applyHostIntent(intent: Intent): void {
  const s = useGameStore.getState();
  switch (intent.type) {
    case "place":
      s.place(intent.index);
      break;
    case "skip":
      s.skip();
      break;
    case "claimBonus":
      s.claimBonus();
      break;
    case "next":
      s.next();
      break;
    case "beginSteal":
      s.beginSteal();
      break;
    case "stealAt":
      s.stealAt(intent.index);
      break;
    case "pass":
      s.pass();
      break;
    case "buy":
      if (intent.playerId !== undefined) s.buy(intent.playerId);
      break;
  }
}
