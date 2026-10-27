/** Een eigen kleur per speler (alleen als extra herkenning, naast de naam). */
export const PLAYER_COLORS = ["#ff6b6b", "#4dabf7", "#94d82d", "#b197fc"];

export function playerColor(id: number): string {
  return PLAYER_COLORS[id % PLAYER_COLORS.length];
}
