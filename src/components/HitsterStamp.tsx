"use client";

import { AnimatePresence, motion } from "motion/react";

/** Groot "HITSTER!" over het scherm als iemand gaat stelen. Alleen sfeer: de tekst staat ook in de gewone meldingen. */
export function HitsterStamp({ name }: { name: string | null }) {
  return (
    <AnimatePresence>
      {name ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 2.6, rotate: -14 }}
          animate={{ opacity: 1, scale: 1, rotate: -7 }}
          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
          transition={{ type: "spring", stiffness: 380, damping: 16 }}
          className="pointer-events-none fixed inset-0 z-40 grid place-items-center"
        >
          <div className="text-center">
            <p
              className="text-6xl font-black tracking-tight text-white sm:text-8xl"
              style={{
                textShadow:
                  "0 0 18px #ff4d8d, 0 0 42px #7c3aed, 4px 6px 0 rgba(0,0,0,0.55)",
                WebkitTextStroke: "2px rgba(0,0,0,0.5)",
              }}
            >
              HITSTER!
            </p>
            <p className="mt-2 inline-block rounded-full bg-black/70 px-5 py-1 text-lg font-bold text-white">
              {name}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
