/**
 * Alle maten van de kamer in meters, en de wiskunde voor waar spelers zitten,
 * waar kaartjes liggen en waar de camera staat. Puur rekenwerk, zonder 3D,
 * zodat het te testen is.
 *
 * Assen: x loopt langs de tafel (oost), z loopt van noord (-) naar zuid (+),
 * y is omhoog. Een speler aan de zuidkant kijkt naar -z.
 */

/** Halve lengte en breedte van de ovale tafel. */
export const TABLE_A = 2.5;
export const TABLE_B = 1.05;
/** Hoogte van het tafelblad (bovenkant). */
export const TABLE_Y = 0.78;
/** Kaartje: vierkant, net als bij het bordspel. */
export const CARD = 0.34;
export const CARD_THICKNESS = 0.004;
export const MAX_SEATS = 4;

export type Seat = {
  /** Midden van de rij kaartjes van deze speler. */
  x: number;
  z: number;
  /** +1 = zuidkant (kijkt naar -z), -1 = noordkant (kijkt naar +z). */
  side: 1 | -1;
  /** Beschikbare breedte voor de rij. */
  width: number;
};

/** Hoe ver de tafelrand op deze x van het midden ligt (op de z-as). */
export function edgeZ(x: number): number {
  const t = Math.min(Math.abs(x) / TABLE_A, 0.999);
  return TABLE_B * Math.sqrt(1 - t * t);
}

function seat(x: number, side: 1 | -1, width: number): Seat {
  return { x, side, width, z: side * Math.max(0.3, edgeZ(x) - 0.52) };
}

/**
 * Zitplaatsen met de klok mee gezien van boven (zuid, west, noord, oost), zodat de
 * beurt de tafel rondgaat zoals bij een echt spel.
 */
export function seatsFor(count: number): Seat[] {
  switch (count) {
    case 2:
      return [seat(0, 1, 3.7), seat(0, -1, 3.7)];
    case 3:
      return [seat(0, 1, 3.6), seat(-1.15, -1, 2.0), seat(1.15, -1, 2.0)];
    default:
      return [
        seat(-1.15, 1, 2.0),
        seat(-1.15, -1, 2.0),
        seat(1.15, -1, 2.0),
        seat(1.15, 1, 2.0),
      ];
  }
}

export type RowLayout = {
  /** x van het midden van elk kaartje, relatief aan het midden van de rij. */
  cards: number[];
  /** x van elke mogelijke plek (aantal kaartjes + 1), relatief aan het midden. */
  slots: number[];
  /** Afstand tussen kaartmiddens. */
  step: number;
  /** Breedte van de hele rij. */
  width: number;
};

const SLOT_GAP = 0.15;
const TIGHT_GAP = 0.035;

/**
 * Verdeel `count` kaartjes over een rij van maximaal `maxWidth`. Past het niet,
 * dan gaan de kaartjes een beetje over elkaar heen liggen, zoals bij echte kaartjes
 * die je dichter bij elkaar schuift.
 */
export function rowLayout(
  count: number,
  maxWidth: number,
  showSlots: boolean,
): RowLayout {
  const gap = showSlots ? SLOT_GAP : TIGHT_GAP;
  const natural = CARD + gap;
  const step =
    count > 1 ? Math.min(natural, (maxWidth - CARD) / (count - 1)) : natural;
  const cards = Array.from(
    { length: count },
    (_, k) => (k - (count - 1) / 2) * step,
  );
  const edge = Math.max(step / 2, CARD / 2 + SLOT_GAP / 2);
  const slots = Array.from({ length: count + 1 }, (_, i) => {
    if (count === 0) return 0;
    if (i === 0) return cards[0] - edge;
    if (i === count) return cards[count - 1] + edge;
    return (cards[i - 1] + cards[i]) / 2;
  });
  const width =
    count > 0 ? slots[count] - slots[0] + SLOT_GAP : CARD + SLOT_GAP * 2;
  return { cards, slots, step, width };
}

export type CameraPose = {
  position: [number, number, number];
  target: [number, number, number];
};

const FOV_DEG = 42;
const PITCH = (54 * Math.PI) / 180;

/**
 * Waar staat de camera om de rij van een speler goed te zien? Zij zit achter de
 * speler, kijkt over de rij heen naar het midden van de tafel. Op een smal scherm
 * (telefoon) kan niet de hele rij in beeld; dan schuift `pan` mee langs de rij.
 */
export function cameraFor(
  s: Seat,
  aspect: number,
  rowWidth: number,
  pan = 0,
): CameraPose {
  const vfov = (FOV_DEG * Math.PI) / 180;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
  // Hoeveel breedte willen we zien: de rij, maar op een smal scherm niet méér dan ~2,5 m.
  const wanted = Math.min(rowWidth + 0.9, aspect < 0.8 ? 2.6 : 5.2);
  const dist = Math.min(6.5, Math.max(2.6, wanted / 2 / Math.tan(hfov / 2)));
  const tx = s.x + pan;
  const tz = s.z * 0.45;
  const ty = TABLE_Y;
  return {
    target: [tx, ty, tz],
    position: [
      tx,
      ty + Math.sin(PITCH) * dist,
      tz + s.side * Math.cos(PITCH) * dist,
    ],
  };
}

/** Een plek voor het gooi-stapeltje van kaartjes die niemand kreeg. */
export const DISCARD_SPOT = { x: 2.0, z: -0.0 };

/** Midden van de tafel: hier ligt de stapel. */
export const DECK_SPOT = { x: 0, z: 0 };

/** Dichtstbijzijnde plek bij een punt op tafel, of null als alles te ver weg is. */
export function nearestSlot(
  slotXs: number[],
  rowCenterX: number,
  rowZ: number,
  x: number,
  z: number,
  maxDistance = 0.3,
): number | null {
  let best: number | null = null;
  let bestDistance = maxDistance;
  slotXs.forEach((sx, i) => {
    const d = Math.hypot(rowCenterX + sx - x, rowZ - z);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  });
  return best;
}
