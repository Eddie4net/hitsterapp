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
      className={`w-44 select-none drop-shadow-[0_-9px_8px_rgba(40,26,10,0.4)] ${flip ? "rotate-180" : ""} ${className}`}
    />
  );
}
