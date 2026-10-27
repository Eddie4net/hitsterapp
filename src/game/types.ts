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
};

export type Phase = "setup" | "placing" | "reveal" | "finished";

export type Result = {
  song: Song;
  correct: boolean;
  index: number;
};
