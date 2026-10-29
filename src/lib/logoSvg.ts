/**
 * Het Hitster-merkteken als SVG-tekst: een vinylplaat met neonregenboogrand, grooves en glans,
 * en een "H" waarvan de dwarsbalk een geluidsgolf is. Dezelfde tekening wordt gebruikt voor de
 * achterkant van de kaartjes, de tokens en het app-icoon. Geen afhankelijkheden, zodat het ook
 * in een los script gebruikt kan worden.
 */

const RIM = [
  "#ff3d8b",
  "#ff7a3d",
  "#ffd23f",
  "#3fe0c8",
  "#4aa8ff",
  "#8b5cf6",
  "#ff3d8b",
];

const f = (n: number) => Math.round(n * 100) / 100;

/** Punt op een cirkel; 0 graden is boven, de klok mee. */
function pt(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

function arc(
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
): string {
  const [x0, y0] = pt(cx, cy, r, from);
  const [x1, y1] = pt(cx, cy, r, to);
  return `M${f(x0)} ${f(y0)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`;
}

/** Een ring van zes bogen die in elkaar overlopen (regenboog), met optionele gloed. */
function rainbowRing(
  id: string,
  cx: number,
  cy: number,
  r: number,
  width: number,
  glow: boolean,
): string {
  const segments = RIM.slice(0, 6).map((color, i) => {
    const from = i * 60 + 3.5;
    const to = (i + 1) * 60 - 3.5;
    const [x0, y0] = pt(cx, cy, r, from);
    const [x1, y1] = pt(cx, cy, r, to);
    return {
      grad: `<linearGradient id="${id}-r${i}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${RIM[i + 1]}"/></linearGradient>`,
      path: arc(cx, cy, r, from, to),
      i,
    };
  });
  const defs = segments.map((s) => s.grad).join("");
  const glowPaths = glow
    ? `<g filter="url(#${id}-blur)" opacity=".7">${segments
        .map(
          (s) =>
            `<path d="${s.path}" stroke="url(#${id}-r${s.i})" stroke-width="${width + 6}" stroke-linecap="round" fill="none"/>`,
        )
        .join("")}</g>`
    : "";
  const paths = segments
    .map(
      (s) =>
        `<path d="${s.path}" stroke="url(#${id}-r${s.i})" stroke-width="${width}" stroke-linecap="round" fill="none"/>`,
    )
    .join("");
  return `<defs>${defs}</defs>${glowPaths}${paths}`;
}

/** Geluidsgolf tussen de twee balken: anderhalve golf, vlak genoeg om als dwarsbalk te lezen. */
const WAVE = (() => {
  const pts: string[] = [];
  for (let x = -17; x <= 17.001; x += 0.85) {
    const y = 5.5 * Math.sin(((x + 17) / 34) * Math.PI * 3);
    pts.push(`${pts.length ? "L" : "M"}${f(x)} ${f(y)}`);
  }
  return pts.join("");
})();

/** De "H": twee balken met een geluidsgolf als dwarsbalk. Getekend rond (0, 0). */
function hMark(id: string, scale: number, cx: number, cy: number): string {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">
<path d="${WAVE}" stroke="url(#${id}-wave)" stroke-width="9" stroke-linecap="round" fill="none" filter="url(#${id}-blur)" opacity=".75"/>
<rect x="-30" y="-30" width="13" height="60" rx="6.5" fill="url(#${id}-bar)"/>
<rect x="17" y="-30" width="13" height="60" rx="6.5" fill="url(#${id}-bar)"/>
<path d="${WAVE}" stroke="url(#${id}-wave)" stroke-width="7.5" stroke-linecap="round" fill="none"/>
<rect x="-28.4" y="-28" width="3" height="52" rx="1.5" fill="#fff" opacity=".55"/>
<rect x="18.6" y="-28" width="3" height="52" rx="1.5" fill="#fff" opacity=".55"/>
</g>`;
}

function sharedDefs(id: string): string {
  return `<defs>
<filter id="${id}-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>
<linearGradient id="${id}-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cdbbff"/></linearGradient>
<linearGradient id="${id}-wave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd23f"/><stop offset=".5" stop-color="#ff7a3d"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient>
</defs>`;
}

function sparkle(
  cx: number,
  cy: number,
  size: number,
  opacity: number,
): string {
  const s = size;
  return `<path d="M${cx} ${cy - s}Q${cx + s * 0.15} ${cy - s * 0.15} ${cx + s} ${cy}Q${cx + s * 0.15} ${cy + s * 0.15} ${cx} ${cy + s}Q${cx - s * 0.15} ${cy + s * 0.15} ${cx - s} ${cy}Q${cx - s * 0.15} ${cy - s * 0.15} ${cx} ${cy - s}Z" fill="#fff" opacity="${opacity}"/>`;
}

/** Vinylplaat met regenboogrand (voor de achterkant van de kaartjes en het icoon). Viewbox 0 0 200 200. */
function disc(id: string): string {
  const grooves = Array.from({ length: 12 }, (_, i) => {
    const r = 57 + i * 2.9;
    const o = i % 4 === 0 ? 0.1 : 0.045;
    return `<circle cx="100" cy="100" r="${f(r)}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width=".7"/>`;
  }).join("");
  const wedge = (from: number, to: number) => {
    const [x0, y0] = pt(100, 100, 96, from);
    const [x1, y1] = pt(100, 100, 96, to);
    return `<path d="M100 100L${f(x0)} ${f(y0)}A96 96 0 0 1 ${f(x1)} ${f(y1)}Z" fill="url(#${id}-sheen)"/>`;
  };
  return `${sharedDefs(id)}<defs>
<radialGradient id="${id}-body" cx=".36" cy=".28" r=".95"><stop offset="0" stop-color="#3a2268"/><stop offset=".55" stop-color="#170c33"/><stop offset="1" stop-color="#070411"/></radialGradient>
<radialGradient id="${id}-label" cx=".34" cy=".28" r=".95"><stop offset="0" stop-color="#7a43e6"/><stop offset=".5" stop-color="#3a1a8c"/><stop offset="1" stop-color="#14083e"/></radialGradient>
<linearGradient id="${id}-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#e2a93b"/><stop offset="1" stop-color="#fff0b8"/></linearGradient>
<linearGradient id="${id}-sheen" x1=".5" y1=".5" x2=".5" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></linearGradient>
</defs>
<circle cx="100" cy="100" r="97" fill="url(#${id}-body)"/>
${grooves}
${wedge(-28, 22)}${wedge(152, 202)}
${rainbowRing(id, 100, 100, 79, 11, true)}
<circle cx="100" cy="100" r="71.5" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1"/>
<circle cx="100" cy="100" r="97" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.2"/>
<circle cx="100" cy="100" r="50" fill="url(#${id}-label)"/>
<circle cx="100" cy="100" r="50" fill="none" stroke="url(#${id}-gold)" stroke-width="1.8"/>
<circle cx="100" cy="100" r="44.5" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1" stroke-dasharray="1 3.2"/>
${hMark(id, 0.86, 100, 100)}
${sparkle(166, 44, 9, 0.95)}${sparkle(38, 152, 5, 0.7)}`;
}

/** Munt voor tokens: gefreesde gouden rand, regenboogring en de H. Viewbox 0 0 200 200. */
function coin(id: string): string {
  return `${sharedDefs(id)}<defs>
<linearGradient id="${id}-metal" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".3" stop-color="#e8b34a"/><stop offset=".55" stop-color="#a8701c"/><stop offset=".8" stop-color="#f2cd6e"/><stop offset="1" stop-color="#8a5a14"/></linearGradient>
<radialGradient id="${id}-face" cx=".36" cy=".28" r=".95"><stop offset="0" stop-color="#4a2a86"/><stop offset=".55" stop-color="#1a0d3a"/><stop offset="1" stop-color="#0a0518"/></radialGradient>
<linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<circle cx="100" cy="100" r="97" fill="url(#${id}-metal)"/>
<circle cx="100" cy="100" r="91.5" fill="none" stroke="#3b2306" stroke-opacity=".55" stroke-width="7" stroke-dasharray="2.4 3.6"/>
<circle cx="100" cy="100" r="85" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>
<circle cx="100" cy="100" r="80" fill="url(#${id}-face)"/>
<circle cx="100" cy="100" r="80" fill="none" stroke="#3b2306" stroke-opacity=".6" stroke-width="2"/>
${rainbowRing(id, 100, 100, 66, 9, false)}
<circle cx="100" cy="100" r="53" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1"/>
${hMark(id, 0.74, 100, 100)}
<path d="${arc(100, 100, 92, -62, 12)}" fill="none" stroke="url(#${id}-shine)" stroke-width="5" stroke-linecap="round" opacity=".85"/>
${sparkle(158, 48, 7, 0.9)}`;
}

export type MarkKind = "disc" | "coin";

/** Binnenwerk van de svg (viewbox 0 0 200 200). `id` moet uniek zijn per tekening op een pagina. */
export function markSvg(id: string, kind: MarkKind = "disc"): string {
  return kind === "coin" ? coin(id) : disc(id);
}

/** Het woord "HITSTER" in dikke letters met een kleurverloop (viewbox 0 0 240 44). */
export function wordmarkSvg(id: string): string {
  return `<defs>
<linearGradient id="${id}-wm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff3d8b"/><stop offset=".35" stop-color="#ff9a3d"/><stop offset=".65" stop-color="#ffd23f"/><stop offset="1" stop-color="#3fe0c8"/></linearGradient>
</defs>
<text x="120" y="32" text-anchor="middle" font-family="var(--font-geist-sans), system-ui, sans-serif" font-weight="900" font-size="30" letter-spacing="7" fill="url(#${id}-wm)">HITSTER</text>`;
}

/** Een los svg-bestand voor het app-icoon: het merkteken op een donker afgerond vierkant. */
export function iconSvg(): string {
  const id = "ic";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><radialGradient id="ic-bg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#241548"/><stop offset="1" stop-color="#0b0716"/></radialGradient></defs>
<rect width="512" height="512" rx="112" fill="url(#ic-bg)"/>
<g transform="translate(46 46) scale(2.1)">${markSvg(id, "disc")}</g>
</svg>
`;
}
