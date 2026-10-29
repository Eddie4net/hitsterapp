"use client";

import { motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { playCue } from "@/lib/feedback";

/** Hoeveel seconden voor het einde de timer gaat tikken en rood wordt. */
const URGENT_SECONDS = 5;

const GLASS =
  "M12 10L48 10C48 28 37 38 31.5 48C37 58 48 68 48 86L12 86C12 68 23 58 28.5 48C23 38 12 28 12 10Z";

/**
 * Zandloper. `fraction` is het deel van de tijd dat nog over is (1 = vol bovenin, 0 = alles
 * beneden). Het zand zakt zichtbaar en er valt een dun straaltje door de nauwe hals.
 */
function Hourglass({
  fraction,
  running,
  urgent,
}: {
  fraction: number;
  running: boolean;
  urgent: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const top = 36 * fraction;
  const bottom = 34 * (1 - fraction);
  const bottomY = 86 - bottom;
  const flowing = running && fraction > 0.005 && fraction < 1;
  const mound = Math.min(1, bottom / 8);
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decoratief, de tijd staat ook als tekst naast de zandloper
    <svg viewBox="0 0 60 96" aria-hidden className="h-[72px] w-[45px]">
      <defs>
        <clipPath id={`${id}-glass`}>
          <path d={GLASS} />
        </clipPath>
        <linearGradient id={`${id}-sand`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={urgent ? "#ff9a7a" : "#ffd978"} />
          <stop offset="1" stopColor={urgent ? "#e2553a" : "#e0952f"} />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a46a38" />
          <stop offset="1" stopColor="#5a3418" />
        </linearGradient>
      </defs>
      {/* Frame */}
      <rect x="9" y="10" width="2.6" height="76" rx="1.3" fill="#5a3418" />
      <rect x="48.4" y="10" width="2.6" height="76" rx="1.3" fill="#5a3418" />
      {/* Glas */}
      <path d={GLASS} fill="rgba(255,255,255,0.12)" />
      <g clipPath={`url(#${id}-glass)`}>
        {top > 0.3 ? (
          <rect
            x="12"
            y={48 - top}
            width="36"
            height={top}
            fill={`url(#${id}-sand)`}
          />
        ) : null}
        {bottom > 0.3 ? (
          <polygon
            points={`12,86 48,86 48,${bottomY + 3} 30,${bottomY - 4 * mound} 12,${bottomY + 3}`}
            fill={`url(#${id}-sand)`}
          />
        ) : null}
        {flowing ? (
          <line
            x1="30"
            y1="47"
            x2="30"
            y2={bottomY - 3}
            stroke="#ffd978"
            strokeWidth="1.4"
            strokeDasharray="2 2.4"
            className="hourglass-stream"
          />
        ) : null}
      </g>
      <path
        d={GLASS}
        fill="none"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="1.3"
      />
      <path
        d="M15 13C15 27 24 36 28 46"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Bovenste en onderste plaat */}
      <rect
        x="6"
        y="3"
        width="48"
        height="7.5"
        rx="2.4"
        fill={`url(#${id}-wood)`}
      />
      <rect
        x="6"
        y="85.5"
        width="48"
        height="7.5"
        rx="2.4"
        fill={`url(#${id}-wood)`}
      />
    </svg>
  );
}

/**
 * Bedenktijd voor het nummer dat nu geraden wordt. De host stuurt de resterende tijd mee,
 * hier lopen we zelf door; elke nieuwe meting zet de teller weer gelijk met de host.
 * Als de tijd om is, stopt (op het tafelscherm) de muziek via `onTimeUp`.
 */
export function TurnTimer({
  timer,
  runKey,
  withSound,
  onTimeUp,
}: {
  timer: { seconds: number; remainingMs: number } | null;
  /** Wisselt bij elk nieuw nummer, zodat de zandloper opnieuw wordt omgedraaid. */
  runKey: string | null;
  /** Tik- en eindgeluid (alleen op het tafelscherm of een gedeeld apparaat). */
  withSound: boolean;
  onTimeUp?: () => void;
}) {
  const [remaining, setRemaining] = useState(timer?.remainingMs ?? 0);
  const endAt = useRef(0);
  const fired = useRef(false);
  const lastTick = useRef<number | null>(null);
  const timeUpRef = useRef(onTimeUp);
  timeUpRef.current = onTimeUp;
  const running = timer !== null;

  // Elke nieuwe meting van de host: eindtijdstip opnieuw bepalen.
  useEffect(() => {
    if (!timer) return;
    endAt.current = Date.now() + timer.remainingMs;
    setRemaining(timer.remainingMs);
  }, [timer]);

  // Nieuw nummer: opnieuw beginnen.
  // biome-ignore lint/correctness/useExhaustiveDependencies: bewust alleen bij een nieuw nummer
  useEffect(() => {
    fired.current = false;
    lastTick.current = null;
  }, [runKey]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, endAt.current - Date.now());
      setRemaining(left);
      const secs = Math.ceil(left / 1000);
      if (
        withSound &&
        left > 0 &&
        secs <= URGENT_SECONDS &&
        lastTick.current !== secs
      ) {
        lastTick.current = secs;
        playCue("tick");
      }
      if (left === 0 && !fired.current) {
        fired.current = true;
        timeUpRef.current?.();
        if (withSound) playCue("timeup");
      }
    }, 200);
    return () => clearInterval(id);
  }, [running, withSound]);

  if (!timer) return null;

  const total = Math.max(timer.seconds * 1000, 1);
  const fraction = Math.min(1, Math.max(0, remaining / total));
  const seconds = Math.ceil(remaining / 1000);
  const timeUp = remaining <= 0;
  const urgent = !timeUp && seconds <= URGENT_SECONDS;

  return (
    <div
      role="timer"
      aria-label={timeUp ? "De tijd is om" : `Nog ${seconds} seconden`}
      className="flex flex-col items-center gap-1 rounded-2xl bg-stone-950/75 px-3 py-2 text-white shadow-lg backdrop-blur-sm"
    >
      {/* Bij elk nieuw nummer wordt de zandloper omgedraaid */}
      <motion.div
        key={runKey ?? "geen"}
        initial={{ rotate: 180 }}
        animate={{ rotate: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 11 }}
        className={urgent ? "animate-pulse" : undefined}
      >
        <Hourglass fraction={fraction} running={!timeUp} urgent={urgent} />
      </motion.div>
      <p
        className={`text-sm font-bold tabular-nums ${urgent || timeUp ? "text-red-300" : "text-white"}`}
      >
        {timeUp ? "Tijd is om" : `${seconds} s`}
      </p>
    </div>
  );
}
