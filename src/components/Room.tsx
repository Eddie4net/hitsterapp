/** Decoratie voor de woonkamer, getekend van bovenaf (alleen voor de sfeer). */

/** Het filter voor de rafelige rand van het pluizige vloerkleed. Staat één keer in de pagina. */
export function FabricDefs() {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: filters zonder zichtbare inhoud, verborgen voor schermlezers
    <svg
      width="0"
      height="0"
      aria-hidden
      className="pointer-events-none absolute"
      focusable="false"
    >
      <defs>
        <filter id="rug-fuzz" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045"
            numOctaves="3"
            seed="4"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * Moderne eetkamerstoel van bovenaf, in één rustige beige tint. De afbeelding is gemaakt met
 * scripts/chair-svg.mts. Het licht komt van de hanglamp boven het midden van de tafel, dus bij
 * een stoel aan de bovenkant van onderen; voor de onderkant draaien we dezelfde afbeelding om.
 */
export function Chair({
  className = "",
  flip = false,
  style,
}: {
  className?: string;
  flip?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    // biome-ignore lint/performance/noImgElement: kleine vaste afbeelding, geen optimalisatie nodig
    <img
      src="/chair-top.png"
      alt=""
      aria-hidden
      draggable={false}
      style={style}
      width={480}
      height={400}
      className={`w-28 select-none drop-shadow-[0_-9px_8px_rgba(40,26,10,0.4)] ${flip ? "rotate-180" : ""} ${className}`}
    />
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
