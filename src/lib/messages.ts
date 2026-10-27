import type { Result } from "@/game/types";

/** Zin die vertelt wat er met het kaartje gebeurde. */
export function resultMessage(
  result: Result,
  players: { id: number; name: string }[],
  activeId: number,
): string {
  const { song, winnerId } = result;
  const where = `${song.title} komt uit ${song.year}.`;
  if (winnerId === activeId) return `Goed! ${where}`;
  const winner = players.find((p) => p.id === winnerId);
  if (winner) return `${winner.name} steelt het kaartje! ${where}`;
  return `Niemand had het goed. ${where}`;
}
