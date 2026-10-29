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
  const inQueue = s.stealQueue.includes(playerId);
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
    case "pick":
      if (s.phase !== "placing" || !isActive || !validSlot(intent.index)) {
        return false;
      }
      s.pick(intent.index);
      return true;
    case "confirm":
      if (s.phase !== "placing" || !isActive || s.pending === null) {
        return false;
      }
      s.confirmPlace();
      return true;
    case "stealPick":
      if (
        s.phase !== "steal" ||
        !s.stealing ||
        !isStealer ||
        !validSlot(intent.index)
      ) {
        return false;
      }
      s.stealPick(intent.index);
      return true;
    case "stealConfirm":
      if (
        s.phase !== "steal" ||
        !s.stealing ||
        !isStealer ||
        s.stealPending === null
      ) {
        return false;
      }
      s.confirmSteal();
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
      // Iedereen met een token mag zelf aangeven dat hij wil stelen, zolang niemand anders bezig is.
      if (s.phase !== "steal" || s.stealing || !inQueue) return false;
      s.beginSteal(playerId);
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
      if (s.phase !== "steal" || !inQueue) return false;
      if (s.stealing && !isStealer) return false;
      s.pass(playerId);
      return true;
    case "passAll":
      if (s.phase !== "steal" || s.stealing || !(isActive || inQueue)) {
        return false;
      }
      s.passAll();
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
    case "pick":
      s.pick(intent.index);
      break;
    case "confirm":
      s.confirmPlace();
      break;
    case "stealPick":
      s.stealPick(intent.index);
      break;
    case "stealConfirm":
      s.confirmSteal();
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
      s.beginSteal(intent.playerId);
      break;
    case "stealAt":
      s.stealAt(intent.index);
      break;
    case "pass":
      s.pass(intent.playerId);
      break;
    case "passAll":
      s.passAll();
      break;
    case "buy":
      if (intent.playerId !== undefined) s.buy(intent.playerId);
      break;
  }
}
