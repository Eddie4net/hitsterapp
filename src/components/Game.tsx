"use client";

import { MotionConfig } from "motion/react";
import { useGameStore } from "@/game/store";
import { Setup } from "./Setup";
import { Table } from "./Table";

export function Game() {
  const phase = useGameStore((s) => s.phase);
  return (
    // Respecteert "minder beweging" in de instellingen van de gebruiker.
    <MotionConfig reducedMotion="user">
      {phase === "setup" ? <Setup /> : <Table />}
    </MotionConfig>
  );
}
