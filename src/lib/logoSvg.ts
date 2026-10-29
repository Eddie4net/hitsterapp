/**
 * Het Spot-On merkteken als SVG-tekst: een neonkompas met een afspeelknop in het midden en een
 * geluidsgolf die uitwaaiert. Dezelfde tekening wordt gebruikt voor de achterkant van de kaartjes,
 * de tokens en het app-icoon. Geen afhankelijkheden, zodat het ook in een los script gebruikt kan worden.
 */

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

function sparkle(
  cx: number,
  cy: number,
  size: number,
  opacity: number,
): string {
  const s = size;
  return `<path d="M${cx} ${cy - s}Q${cx + s * 0.15} ${cy - s * 0.15} ${cx + s} ${cy}Q${cx + s * 0.15} ${cy + s * 0.15} ${cx} ${cy + s}Q${cx - s * 0.15} ${cy + s * 0.15} ${cx - s} ${cy}Q${cx - s * 0.15} ${cy - s * 0.15} ${cx} ${cy - s}Z" fill="#fff" opacity="${opacity}"/>`;
}

/** Vierpuntige kompasster: vier punten (hoek in graden, lengte) met een smalle taille ertussen. */
function star(
  cx: number,
  cy: number,
  tips: [number, number][],
  waist: number,
): string {
  const pts: string[] = [];
  tips.forEach(([deg, r], i) => {
    const [x, y] = pt(cx, cy, r, deg);
    pts.push(`${f(x)} ${f(y)}`);
    const next = tips[(i + 1) % tips.length][0];
    const mid = deg + ((next - deg + 360) % 360 || 360) / 2;
    const [wx, wy] = pt(cx, cy, waist, mid);
    pts.push(`${f(wx)} ${f(wy)}`);
  });
  return `M${pts.join("L")}Z`;
}

/** Geluidsgolf als staafjes links en rechts van de afspeelknop, lager naar buiten toe. */
function waveBars(
  id: string,
  cx: number,
  cy: number,
  inner: number,
  span: number,
  tall: number,
): string {
  const bars: string[] = [];
  const n = Math.floor(span / 6.5);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const h =
      tall * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + 0.6))) * (1 - t * 0.55);
    for (const side of [-1, 1]) {
      const x = cx + side * (inner + i * 6.5);
      bars.push(
        `<line x1="${f(x)}" y1="${f(cy - h / 2)}" x2="${f(x)}" y2="${f(cy + h / 2)}"/>`,
      );
    }
  }
  return `<g stroke="url(#${id}-wavebar)" stroke-width="3" stroke-linecap="round">${bars.join("")}</g>`;
}

/** De afspeelknop: oranje bol met witte rand en een driehoek. Getekend rond (cx, cy). */
function playButton(id: string, scale: number, cx: number, cy: number): string {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">
<circle r="30" fill="#ff8a1f" filter="url(#${id}-blur)" opacity=".65"/>
<circle r="25" fill="url(#${id}-orb)"/>
<circle r="25" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="2.4"/>
<path d="M-7 -12L14 0L-7 12Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
<path d="M-14 -16A22 22 0 0 1 8 -21" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"/>
</g>`;
}

function sharedDefs(id: string): string {
  return `<defs>
<filter id="${id}-blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.4"/></filter>
<radialGradient id="${id}-orb" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffd23f"/><stop offset=".55" stop-color="#ff8a1f"/><stop offset="1" stop-color="#e8431f"/></radialGradient>
<linearGradient id="${id}-wavebar" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="180" y2="0"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".5" stop-color="#4aa8ff"/><stop offset="1" stop-color="#3fe0c8"/></linearGradient>
<linearGradient id="${id}-neon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3fe0c8"/><stop offset=".5" stop-color="#4aa8ff"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>
<linearGradient id="${id}-starcool" x1=".5" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#7dfff0"/><stop offset=".5" stop-color="#3fb4ff"/><stop offset="1" stop-color="#5a3fd8"/></linearGradient>
<linearGradient id="${id}-starwarm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient>
</defs>`;
}

/** Het kompas: neonster met een warme reservester eronder. */
function compass(id: string, r: number, glow: boolean): string {
  const main = star(
    100,
    100,
    [
      [0, r],
      [90, r * 0.66],
      [180, r * 0.66],
      [270, r * 0.66],
    ],
    r * 0.16,
  );
  const warm = star(
    100,
    100,
    [
      [45, r * 0.78],
      [135, r * 0.6],
      [225, r * 0.6],
      [315, r * 0.78],
    ],
    r * 0.13,
  );
  const halo = glow
    ? `<path d="${main}" fill="url(#${id}-starcool)" filter="url(#${id}-blur)" opacity=".65"/>`
    : "";
  return `${halo}
<path d="${warm}" fill="url(#${id}-starwarm)" opacity=".92"/>
<path d="${main}" fill="url(#${id}-starcool)"/>
<path d="${main}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`;
}

/** Het merkteken voor kaartjes en icoon: donker medaillon met neonrand. Viewbox 0 0 200 200. */
function disc(id: string): string {
  return `${sharedDefs(id)}<defs>
<radialGradient id="${id}-body" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#1b2a6b"/><stop offset=".6" stop-color="#0b1236"/><stop offset="1" stop-color="#050818"/></radialGradient>
</defs>
<circle cx="100" cy="100" r="97" fill="url(#${id}-body)"/>
<circle cx="100" cy="100" r="88" fill="none" stroke="url(#${id}-neon)" stroke-width="9" filter="url(#${id}-blur)" opacity=".8"/>
<circle cx="100" cy="100" r="88" fill="none" stroke="url(#${id}-neon)" stroke-width="5"/>
<circle cx="100" cy="100" r="79" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1"/>
<circle cx="100" cy="100" r="64" fill="none" stroke="#8b5cf6" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="2 4"/>
${compass(id, 84, true)}
${waveBars(id, 100, 100, 34, 62, 52)}
${playButton(id, 1.05, 100, 100)}
${sparkle(160, 40, 8, 0.95)}${sparkle(42, 158, 5, 0.7)}`;
}

/** Munt voor tokens: gouden rand en een kleinere variant van het kompas. Viewbox 0 0 200 200. */
function coin(id: string): string {
  return `${sharedDefs(id)}<defs>
<linearGradient id="${id}-metal" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".3" stop-color="#e8b34a"/><stop offset=".55" stop-color="#a8701c"/><stop offset=".8" stop-color="#f2cd6e"/><stop offset="1" stop-color="#8a5a14"/></linearGradient>
<radialGradient id="${id}-face" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#1b2a6b"/><stop offset=".6" stop-color="#0b1236"/><stop offset="1" stop-color="#050818"/></radialGradient>
<linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<circle cx="100" cy="100" r="97" fill="url(#${id}-metal)"/>
<circle cx="100" cy="100" r="91.5" fill="none" stroke="#3b2306" stroke-opacity=".55" stroke-width="7" stroke-dasharray="2.4 3.6"/>
<circle cx="100" cy="100" r="85" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>
<circle cx="100" cy="100" r="80" fill="url(#${id}-face)"/>
<circle cx="100" cy="100" r="80" fill="none" stroke="#3b2306" stroke-opacity=".6" stroke-width="2"/>
<circle cx="100" cy="100" r="70" fill="none" stroke="url(#${id}-neon)" stroke-width="5"/>
${compass(id, 64, false)}
${playButton(id, 0.9, 100, 100)}
<path d="${arc(100, 100, 92, -62, 12)}" fill="none" stroke="url(#${id}-shine)" stroke-width="5" stroke-linecap="round" opacity=".85"/>
${sparkle(158, 48, 7, 0.9)}`;
}

export type MarkKind = "disc" | "coin";

/** Binnenwerk van de svg (viewbox 0 0 200 200). `id` moet uniek zijn per tekening op een pagina. */
export function markSvg(id: string, kind: MarkKind = "disc"): string {
  return kind === "coin" ? coin(id) : disc(id);
}

/** Het woord "Spot-On" in dikke oranje letters met donkere rand en gloed (viewbox 0 0 240 52). */
export function wordmarkSvg(id: string): string {
  return `<defs>
<linearGradient id="${id}-wm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset=".5" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ff5a1f"/></linearGradient>
<filter id="${id}-glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<text x="120" y="38" text-anchor="middle" font-family="var(--font-geist-sans), system-ui, sans-serif" font-weight="900" font-style="italic" font-size="38" fill="#ff8a1f" stroke="#ff8a1f" stroke-width="6" stroke-linejoin="round" filter="url(#${id}-glow)" opacity=".6">Spot-On</text>
<text x="120" y="38" text-anchor="middle" font-family="var(--font-geist-sans), system-ui, sans-serif" font-weight="900" font-style="italic" font-size="38" fill="url(#${id}-wm)" stroke="#0b1236" stroke-width="5" paint-order="stroke" stroke-linejoin="round">Spot-On</text>`;
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
