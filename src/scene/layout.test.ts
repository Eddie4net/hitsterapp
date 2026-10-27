import { describe, expect, it } from "vitest";
import {
  CARD,
  cameraFor,
  edgeZ,
  nearestSlot,
  rowLayout,
  seatsFor,
  TABLE_A,
  TABLE_B,
  TABLE_Y,
} from "./layout";

describe("edgeZ", () => {
  it("is de halve breedte in het midden en kleiner richting de uiteinden", () => {
    expect(edgeZ(0)).toBeCloseTo(TABLE_B);
    expect(edgeZ(TABLE_A * 0.9)).toBeLessThan(edgeZ(TABLE_A * 0.5));
    expect(edgeZ(TABLE_A)).toBeGreaterThan(0);
  });
});

describe("seatsFor", () => {
  it.each([2, 3, 4])("geeft %i plekken die op de tafel liggen", (n) => {
    const seats = seatsFor(n);
    expect(seats).toHaveLength(n);
    for (const s of seats) {
      expect(Math.abs(s.z)).toBeLessThan(edgeZ(s.x));
      expect(Math.abs(s.x) + s.width / 2).toBeLessThan(TABLE_A + 0.2);
    }
  });

  it("zet de speler met de klok mee: zuid, dan westen, dan noord", () => {
    const [a, b] = seatsFor(2);
    expect([a.side, b.side]).toEqual([1, -1]);
    const four = seatsFor(4);
    expect(four.map((s) => s.side)).toEqual([1, -1, -1, 1]);
    expect(four[0].x).toBeLessThan(0);
    expect(four[3].x).toBeGreaterThan(0);
  });
});

describe("rowLayout", () => {
  it("legt kaartjes gecentreerd en zonder overlap als er ruimte is", () => {
    const row = rowLayout(3, 4, false);
    expect(row.cards[1]).toBeCloseTo(0);
    expect(row.cards[0]).toBeCloseTo(-row.cards[2]);
    expect(row.step).toBeGreaterThanOrEqual(CARD);
  });

  it("heeft één plek meer dan kaartjes, gesorteerd van links naar rechts", () => {
    const row = rowLayout(4, 4, true);
    expect(row.slots).toHaveLength(5);
    for (let i = 1; i < row.slots.length; i++) {
      expect(row.slots[i]).toBeGreaterThan(row.slots[i - 1]);
    }
    // Elke plek ligt tussen of naast kaartjes.
    expect(row.slots[0]).toBeLessThan(row.cards[0]);
    expect(row.slots[4]).toBeGreaterThan(row.cards[3]);
  });

  it("past een lange rij in de beschikbare breedte door te overlappen", () => {
    const row = rowLayout(10, 2.0, false);
    const span = row.cards[9] - row.cards[0] + CARD;
    expect(span).toBeLessThanOrEqual(2.0 + 1e-9);
    expect(row.step).toBeLessThan(CARD);
  });

  it("werkt met één kaartje en met een lege rij", () => {
    expect(rowLayout(1, 3, true).slots).toHaveLength(2);
    expect(rowLayout(0, 3, true).slots).toHaveLength(1);
  });
});

describe("cameraFor", () => {
  it("staat achter de speler, boven de tafel, en kijkt naar de tafel", () => {
    const south = seatsFor(2)[0];
    const north = seatsFor(2)[1];
    const a = cameraFor(south, 16 / 9, 3);
    const b = cameraFor(north, 16 / 9, 3);
    expect(a.position[1]).toBeGreaterThan(TABLE_Y + 1);
    expect(a.position[2]).toBeGreaterThan(a.target[2]); // zuid: camera zuidelijker dan het doel
    expect(b.position[2]).toBeLessThan(b.target[2]); // noord: andersom
  });

  it("gaat verder weg bij een lange rij, maar begrensd", () => {
    const s = seatsFor(2)[0];
    const near = cameraFor(s, 16 / 9, 1);
    const far = cameraFor(s, 16 / 9, 4);
    expect(far.position[1]).toBeGreaterThan(near.position[1]);
    expect(far.position[1]).toBeLessThan(10);
  });

  it("neemt op een smal scherm een smaller stuk van de rij en schuift met pan mee", () => {
    const s = seatsFor(2)[0];
    const portrait = cameraFor(s, 0.46, 4, 0);
    const panned = cameraFor(s, 0.46, 4, 1.2);
    expect(panned.target[0]).toBeCloseTo(portrait.target[0] + 1.2);
  });
});

describe("nearestSlot", () => {
  const slots = [-0.6, -0.2, 0.2, 0.6];
  it("vindt de dichtstbijzijnde plek", () => {
    expect(nearestSlot(slots, 0, 0.5, 0.18, 0.5)).toBe(2);
    expect(nearestSlot(slots, 0, 0.5, -0.55, 0.45)).toBe(0);
  });
  it("geeft null als je te ver weg bent", () => {
    expect(nearestSlot(slots, 0, 0.5, 0, 0)).toBeNull();
  });
});
