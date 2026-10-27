/** Decoratie voor de woonkamer, getekend van bovenaf (alleen voor de sfeer). */

const LEG_SPOTS: [number, number][] = [
  [20, 36],
  [100, 36],
  [20, 82],
  [100, 82],
];

/**
 * Moderne eetkamerstoel van bovenaf: zwart stalen poten, gestoffeerde zitting
 * en een gebogen rugleuning. `flip` draait hem voor de onderkant van de tafel.
 */
export function Chair({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decoratief en verborgen voor schermlezers
    <svg
      viewBox="0 0 120 100"
      aria-hidden
      className={`w-28 drop-shadow-[6px_12px_8px_rgba(0,0,0,0.38)] ${flip ? "rotate-180" : ""} ${className}`}
    >
      <defs>
        <linearGradient id="chair-seat" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#b3bdb0" />
          <stop offset="1" stopColor="#7d8a7b" />
        </linearGradient>
        <linearGradient id="chair-back" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1d1d20" />
          <stop offset="0.5" stopColor="#34343a" />
          <stop offset="1" stopColor="#1d1d20" />
        </linearGradient>
      </defs>
      {LEG_SPOTS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={5} fill="#141416" />
      ))}
      <rect
        x="14"
        y="30"
        width="92"
        height="60"
        rx="22"
        fill="url(#chair-seat)"
      />
      <rect
        x="20"
        y="36"
        width="80"
        height="48"
        rx="16"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <path
        d="M8 28 Q60 2 112 28 L107 43 Q60 21 13 43 Z"
        fill="url(#chair-back)"
      />
      <path
        d="M10 29 Q60 5 110 29"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const LEAF_ANGLES = Array.from({ length: 14 }, (_, i) => i * (360 / 14));

/** Kamerplant in een pot, van bovenaf. */
export function Plant({ className = "" }: { className?: string }) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decoratief en verborgen voor schermlezers
    <svg
      viewBox="0 0 160 160"
      aria-hidden
      className={`drop-shadow-[8px_14px_10px_rgba(0,0,0,0.35)] ${className}`}
    >
      <circle
        cx="80"
        cy="80"
        r="40"
        fill="#e7e2d6"
        stroke="#c8c1b0"
        strokeWidth="3"
      />
      <g transform="translate(80 80)">
        {LEAF_ANGLES.map((a, i) => (
          <g key={a} transform={`rotate(${a})`}>
            <ellipse
              cx="0"
              cy="-40"
              rx="12"
              ry="36"
              fill={i % 2 ? "#3b7a3c" : "#2c6a32"}
            />
            <path
              d="M0 -12 L0 -70"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.5"
            />
          </g>
        ))}
        {LEAF_ANGLES.map((a, i) => (
          <ellipse
            key={`in-${a}`}
            cx="0"
            cy="-20"
            rx="8"
            ry="20"
            fill={i % 2 ? "#58a04f" : "#4a9348"}
            transform={`rotate(${a + 12})`}
          />
        ))}
        <circle r="6" fill="#2c6a32" />
      </g>
    </svg>
  );
}
