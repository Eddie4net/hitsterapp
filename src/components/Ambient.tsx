"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect } from "react";

export type Pulse = "good" | "bad" | "steal" | null;

const PULSE_COLORS: Record<Exclude<Pulse, null>, string> = {
  good: "rgba(255, 214, 102, 0.45)",
  bad: "rgba(220, 50, 60, 0.4)",
  steal: "rgba(150, 90, 255, 0.42)",
};

/** Vaste plekken voor de stofjes in het licht, zodat server en browser gelijk renderen. */
const DUST = [
  { left: "8%", top: "20%", size: 3, delay: 0, dur: 14 },
  { left: "18%", top: "70%", size: 2, delay: 3, dur: 18 },
  { left: "27%", top: "40%", size: 4, delay: 6, dur: 16 },
  { left: "36%", top: "82%", size: 2, delay: 1, dur: 20 },
  { left: "45%", top: "15%", size: 3, delay: 8, dur: 15 },
  { left: "54%", top: "60%", size: 2, delay: 4, dur: 19 },
  { left: "63%", top: "30%", size: 4, delay: 2, dur: 17 },
  { left: "72%", top: "76%", size: 3, delay: 9, dur: 14 },
  { left: "81%", top: "48%", size: 2, delay: 5, dur: 21 },
  { left: "90%", top: "22%", size: 3, delay: 7, dur: 16 },
  { left: "14%", top: "52%", size: 2, delay: 10, dur: 18 },
  { left: "58%", top: "10%", size: 3, delay: 11, dur: 13 },
];

/**
 * Sfeerlaag over de kamer: een warme lamp die zacht meebeweegt met de muis,
 * stofjes in het licht, een vignet en een lichtflits bij goed, fout of stelen.
 * Het zit boven de tafel maar vangt geen klikken op.
 */
export function Ambient({
  pulse,
  pulseKey,
}: {
  pulse: Pulse;
  pulseKey: number;
}) {
  const reduced = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 40, damping: 20 });
  const y = useSpring(py, { stiffness: 40, damping: 20 });

  useEffect(() => {
    if (reduced) return;
    function onMove(e: PointerEvent) {
      px.set((e.clientX / window.innerWidth - 0.5) * 60);
      py.set((e.clientY / window.innerHeight - 0.5) * 40);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, px, py]);

  return (
    <>
      {/* Hanglamp: ligt onder de tafel en verlicht vloer en kleed, zodat kaartjes en tekst scherp blijven */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <motion.div
          style={{ x, y }}
          className="absolute left-1/2 top-[40%] h-[130%] w-[100%] -translate-x-1/2 -translate-y-1/2 mix-blend-soft-light"
        >
          <div className="size-full bg-[radial-gradient(ellipse_at_center,rgba(255,226,170,0.9),rgba(255,226,170,0.35)_40%,transparent_70%)]" />
        </motion.div>
      </div>
      <Overlay pulse={pulse} pulseKey={pulseKey} />
    </>
  );
}

/** Alles wat boven de tafel ligt blijft licht: alleen een randvignet, kleine stofjes en een korte flits. */
function Overlay({ pulse, pulseKey }: { pulse: Pulse; pulseKey: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {/* Vignet: alleen de uiterste hoeken van de kamer zijn donkerder */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_62%,rgba(10,5,0,0.4)_100%)]" />

      {/* Stofjes die door het licht zweven */}
      {DUST.map((d) => (
        <span
          key={`${d.left}-${d.top}`}
          className="dust absolute rounded-full bg-amber-100/70"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        />
      ))}

      {/* Lichtflits bij een uitkomst */}
      {pulse ? (
        <motion.div
          key={pulseKey}
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 45%, ${PULSE_COLORS[pulse]}, transparent 70%)`,
          }}
        />
      ) : null}
    </div>
  );
}
