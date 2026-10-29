/**
 * Bron van de stoel (public/chair-top.png): een moderne eetkamerstoel van bovenaf, in één
 * rustige beige tint (zitting en rug dezelfde kleur), met bouclé-stof, pijpjes, stiknaad en
 * zwarte stalen poten. Het licht komt vanuit het midden van de tafel (hanglamp), dus bij een
 * stoel aan de bovenkant van onderen. De stoelen aan de onderkant zijn dezelfde afbeelding,
 * 180 graden gedraaid.
 *
 * Opnieuw maken: `node scripts/chair-svg.mts` schrijft public/dev-chair.svg; open dat in de
 * browser en sla het op als PNG (zie scripts/README.md).
 */
import { writeFileSync } from "node:fs";

const BASE = "#cdbfa8";
const SHADE = "#3b3025";

type P = [number, number];

function bezier(p0: P, p1: P, p2: P, t: number): P {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

const OUTER: [P, P, P] = [
  [6, 31],
  [60, -1],
  [114, 31],
];
const INNER: [P, P, P] = [
  [11, 46],
  [60, 19],
  [109, 46],
];

const channels = [0.18, 0.34, 0.5, 0.66, 0.82]
  .map((t) => {
    const [x0, y0] = bezier(...OUTER, t);
    const [x1, y1] = bezier(...INNER, t);
    return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${SHADE}" stroke-opacity=".32" stroke-width="1" fill="none"/>`;
  })
  .join("");

const legs = (
  [
    [18, 34],
    [102, 34],
    [18, 86],
    [102, 86],
  ] as P[]
)
  .map(
    ([x, y]) =>
      `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="3" fill="url(#leg)"/><rect x="${x - 3.6}" y="${y - 4.2}" width="3" height="3" rx="1.2" fill="#fff" opacity=".28"/>`,
  )
  .join("");

const filter = (
  id: string,
  freq: string,
  scale: number,
  elevation: number,
  extra = "",
) => `
<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
${extra}<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="7" result="fine"/>
<feDiffuseLighting in="fine" surfaceScale="${scale}" diffuse-constant="1.15" lighting-color="#fff" result="lit"><feDistantLight azimuth="90" elevation="${elevation}"/></feDiffuseLighting>
<feComponentTransfer in="lit" result="soft"><feFuncR type="linear" slope=".5" intercept=".6"/><feFuncG type="linear" slope=".5" intercept=".6"/><feFuncB type="linear" slope=".5" intercept=".6"/></feComponentTransfer>
<feComposite in="soft" in2="SourceGraphic" operator="arithmetic" k1="1.22" k2="0" k3="0" k4="0" result="shaded"/>
<feComposite in="shaded" in2="SourceAlpha" operator="in"/>
</filter>`;

export function chairSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="480" height="400">
<defs>
${filter("boucle", "0.55", 2.2, 54)}
${filter("velvet", "1.1 0.05", 0.9, 62)}
<radialGradient id="pillow" cx=".5" cy=".62" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="${SHADE}" stop-opacity=".3"/></radialGradient>
<linearGradient id="backshade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${SHADE}" stop-opacity=".32"/><stop offset=".28" stop-color="${SHADE}" stop-opacity="0"/><stop offset=".72" stop-color="${SHADE}" stop-opacity="0"/><stop offset="1" stop-color="${SHADE}" stop-opacity=".32"/></linearGradient>
<linearGradient id="leg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4a50"/><stop offset=".5" stop-color="#151517"/><stop offset="1" stop-color="#0b0b0c"/></linearGradient>
</defs>
${legs}
<rect x="13" y="30.5" width="94" height="62" rx="24" fill="${SHADE}" opacity=".5"/>
<rect x="14" y="29" width="92" height="60" rx="22" fill="${BASE}" filter="url(#boucle)"/>
<rect x="14" y="29" width="92" height="60" rx="22" fill="url(#pillow)"/>
<rect x="14.8" y="29.8" width="90.4" height="58.4" rx="21.4" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1.2"/>
<rect x="13.4" y="28.4" width="93.2" height="61.2" rx="22.6" fill="none" stroke="${SHADE}" stroke-opacity=".4" stroke-width=".9"/>
<rect x="22" y="37" width="76" height="44" rx="16" fill="none" stroke="${SHADE}" stroke-opacity=".38" stroke-width="1" stroke-dasharray="2.4 2.2"/>
<rect x="22.6" y="37.7" width="76" height="44" rx="16" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width=".7" stroke-dasharray="2.4 2.2"/>
<path d="M6 31Q60 -1 114 31L109 46Q60 19 11 46Z" fill="${BASE}" filter="url(#velvet)"/>
<path d="M6 31Q60 -1 114 31L109 46Q60 19 11 46Z" fill="url(#backshade)"/>
${channels}
<path d="M7 30.5Q60 0 113 30.5" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.3"/>
<path d="M11 46Q60 19 109 46" fill="none" stroke="${SHADE}" stroke-opacity=".4" stroke-width="1"/>
<rect x="3" y="28" width="8" height="19" rx="3" fill="url(#leg)" transform="rotate(-12 7 37)"/>
<rect x="109" y="28" width="8" height="19" rx="3" fill="url(#leg)" transform="rotate(12 113 37)"/>
</svg>
`;
}

writeFileSync("public/dev-chair.svg", chairSvg());
console.log("public/dev-chair.svg geschreven");
