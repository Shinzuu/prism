/* Every design number for the airframe, in metres, in one place.

   These are the published figures for the aircraft the hero draws, and the
   geometry below is computed from them rather than drawn to look right. The
   sweep solve in particular is not decorative: a pivot placed by eye cannot
   hit both published spans, and the drawing would then be quoting numbers its
   own wings disagree with. */

export const LENGTH = 19.10;          // nose to tail
export const SPAN_UNSWEPT = 19.54;    // at 20° sweep
export const SPAN_SWEPT = 11.65;      // at 68° sweep
export const HEIGHT = 4.88;           // ground to fin tip

export const SWEEP_MIN = 20;          // degrees
export const SWEEP_MAX = 68;

const rad = (d: number) => (d * Math.PI) / 180;

/* Solve the pivot station and panel length from the two published spans.
     pivotX + panel·cos(20°) = SPAN_UNSWEPT / 2
     pivotX + panel·cos(68°) = SPAN_SWEPT   / 2
   Subtracting removes the pivot, which is the only way to get both numbers
   right at once — pick the pivot first and one of the two spans is wrong. */
export const PANEL =
  (SPAN_UNSWEPT / 2 - SPAN_SWEPT / 2) / (Math.cos(rad(SWEEP_MIN)) - Math.cos(rad(SWEEP_MAX)));
export const PIVOT_X = SPAN_UNSWEPT / 2 - PANEL * Math.cos(rad(SWEEP_MIN));
export const PIVOT_Z = -1.10;

/** Half-span in metres at a given sweep angle, straight from the geometry. */
export function halfSpanAt(sweepDeg: number): number {
  return PIVOT_X + PANEL * Math.cos(rad(sweepDeg));
}
/** Full span in metres at a given sweep angle. */
export function spanAt(sweepDeg: number): number {
  return 2 * halfSpanAt(sweepDeg);
}

/* Forward fuselage only: nose to the intakes. The wide part of this aircraft
   is two engine nacelles with a flat deck between them, not a fat tube, and
   modelling it as one lofted body was what made the first version unreadable. */
export const NOSE: Array<{ z: number; w: number; top: number; bot: number; flat: number }> = [
  { z: -9.55, w: 0.04, top: 0.03, bot: -0.03, flat: 2.0 },
  { z: -8.90, w: 0.34, top: 0.24, bot: -0.28, flat: 2.2 },
  { z: -8.00, w: 0.58, top: 0.46, bot: -0.52, flat: 2.4 },
  { z: -7.00, w: 0.76, top: 0.66, bot: -0.66, flat: 2.6 },
  { z: -6.00, w: 0.88, top: 0.80, bot: -0.74, flat: 2.8 },
  { z: -4.80, w: 0.98, top: 0.86, bot: -0.80, flat: 3.0 },
  { z: -3.60, w: 1.10, top: 0.70, bot: -0.84, flat: 3.6 },
  /* Widening to the deck's half-width so the two meet flush instead of
     leaving a step you can see from any angle. */
  { z: -2.40, w: 1.30, top: 0.48, bot: -0.76, flat: 4.4 },
  { z: -1.00, w: 1.44, top: 0.34, bot: -0.64, flat: 5.2 },
  { z: 0.60, w: 1.46, top: 0.28, bot: -0.58, flat: 5.6 },
];

/** The two engine nacelles: long tubes either side of the deck. */
export const NACELLE = { x: 1.46, r: 0.82, z0: -3.60, z1: 9.30 };

/** The flat deck between the nacelles — this aircraft's defining plan shape. */
export const DECK = { halfW: 1.46, z0: -3.40, z1: 7.90, top: 0.28, bot: -0.58 };

/** Fixed leading-edge extensions, fuselage side out to the wing pivot. */
export const GLOVE = { xIn: 1.30, xOut: PIVOT_X, zLE: -4.60, zTE: -0.10, y: 0.06, thick: 0.26 };

/** Twin fins, standing on the nacelles and canted outward. */
export const FIN = {
  x: 1.50, base: 0.58, height: 2.55, cant: 12,
  rootLE: 3.70, rootTE: 7.10, tipLE: 5.55, tipTE: 7.15, thick: 0.15,
};

/** All-moving tailplanes, below and behind the fins. */
export const STAB = {
  xIn: 1.30, xOut: 4.95, y: -0.20, thick: 0.15,
  rootLE: 6.30, rootTE: 8.70, tipLE: 8.05, tipTE: 9.05,
};

/** Small stabilising fins under the aft nacelles. */
export const VENTRAL = { x: 1.40, top: -0.52, drop: 0.86, z0: 6.40, z1: 8.10, thick: 0.10, cant: 22 };

export const CANOPY = { z0: -7.10, z1: -4.10, w: 0.74, h: 0.62, y: 0.70 };

/* The five callouts, anchored to a point on the airframe in model space so the
   labels follow the aircraft rather than sitting at fixed screen positions. */
export const CALLOUTS: Array<{ id: string; text: string; at: [number, number, number] }> = [
  { id: '01', text: 'radar · pulse-doppler', at: [0, 0.05, -8.90] },
  { id: '02', text: 'cockpit · tandem', at: [0, 0.95, -5.40] },
  { id: '03', text: 'engine · 2 × afterburning', at: [NACELLE.x, -0.15, 9.10] },
  { id: '04', text: 'hardpoint · 4 stations', at: [2.10, -1.00, -0.60] },
  { id: '05', text: 'wing · 20°–68° sweep', at: [PIVOT_X + PANEL * 0.55, 0.25, PIVOT_Z + 0.6] },
];

/* Reported in the title block, and checked by the tests. */
export const SHEET = {
  scale: '1:96',
  projection: 'THIRD ANGLE',
  title: 'GENERAL ARRANGEMENT · VARIABLE GEOMETRY',
};
