"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import type { ReactNode } from "react";

/** Kaartje dat bij de muis opveert, meekantelt en glanst. Op touch en bij "minder beweging" blijft het stil. */
export function TiltCard({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.42), transparent 55%)`;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    ry.set((x - 0.5) * 18);
    rx.set(-(y - 0.5) * 18);
    gx.set(x * 100);
    gy.set(y * 100);
  }

  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={reduced ? undefined : { y: -8, scale: 1.04 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 700 }}
      className="relative"
    >
      {children}
      <motion.div
        aria-hidden
        style={{ background: glare }}
        className="pointer-events-none absolute inset-0 rounded-md opacity-0 mix-blend-overlay transition-opacity hover:opacity-100 [div:hover>&]:opacity-100"
      />
    </motion.div>
  );
}
