export type Song = {
  id: string;
  title: string;
  artist: string;
  year: number;
};

export type Player = {
  id: number;
  name: string;
  /** Altijd gesorteerd op jaar: alleen goed geplaatste kaartjes komen erin. */
  timeline: Song[];
  tokens: number;
};

/**
 * placing: de speler aan de beurt kiest een plek.
 * steal: anderen mogen een token inzetten om een andere plek te kiezen.
 * reveal: het jaar is bekend en het kaartje is verdeeld.
 */
export type Phase = "setup" | "placing" | "steal" | "reveal" | "finished";

/** Een gekozen plek in de tijdlijn van de speler aan de beurt. */
export type Placement = {
  playerId: number;
  index: number;
};

export type Result = {
  song: Song;
  /** Wie het kaartje krijgt; null als niemand het goed had. */
  winnerId: number | null;
  activeCorrect: boolean;
  placements: Placement[];
};
