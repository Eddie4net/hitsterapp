"use client";

import { useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Laat de tafel een beetje kantelen alsof je erop kijkt, met zachte parallax
 * als je de muis beweegt. Alleen op een groot scherm met een muis, en nooit
 * als iemand "minder beweging" heeft gekozen (of op een telefoon, waar slepen
 * voorrang heeft).
 */
export function useTilt() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(px, { stiffness: 60, damping: 18 });
  const rotateX = useSpring(py, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const query = window.matchMedia("(min-width: 900px) and (pointer: fine)");
    const update = () => setEnabled(query.matches && !reduced);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [reduced]);

  useEffect(() => {
    if (!enabled) {
      px.set(0);
      py.set(0);
      return;
    }
    py.set(9);
    function onMove(e: PointerEvent) {
      px.set((e.clientX / window.innerWidth - 0.5) * 5);
      py.set(9 - (e.clientY / window.innerHeight - 0.5) * 3);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, px, py]);

  return { enabled, rotateX, rotateY };
}
