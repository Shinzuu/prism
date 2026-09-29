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

/* Longitudinal stations, nose at -Z. Each is a cross-section of the central
   body: half width, and the top and bottom of the section at the centreline.
   The body is lofted through these rather than modelled as a primitive. */
export const STATIONS: Array<{ z: number; w: number; top: number; bot: number; flat: number }> = [
  { z: -9.55, w: 0.05, top: 0.04, bot: -0.04, flat: 2.0 },
  { z: -8.70, w: 0.42, top: 0.30, bot: -0.36, flat: 2.2 },
  { z: -7.60, w: 0.72, top: 0.58, bot: -0.62, flat: 2.4 },
  { z: -6.40, w: 0.92, top: 0.86, bot: -0.78, flat: 2.6 },
  { z: -5.10, w: 1.04, top: 0.98, bot: -0.84, flat: 2.8 },
  { z: -3.80, w: 1.34, top: 0.82, bot: -0.92, flat: 3.4 },
  { z: -2.40, w: 2.20, top: 0.70, bot: -0.98, flat: 4.4 },
  { z: -1.10, w: 2.95, top: 0.64, bot: -1.00, flat: 5.4 },
  { z: 0.60, w: 3.15, top: 0.60, bot: -0.98, flat: 6.0 },
  { z: 2.60, w: 3.10, top: 0.56, bot: -0.94, flat: 6.0 },
  { z: 4.60, w: 2.85, top: 0.52, bot: -0.88, flat: 5.4 },
  { z: 6.60, w: 2.45, top: 0.48, bot: -0.80, flat: 4.6 },
  { z: 8.20, w: 2.10, top: 0.44, bot: -0.66, flat: 4.0 },
  { z: 9.55, w: 1.85, top: 0.38, bot: -0.52, flat: 3.6 },
];

export const NACELLE = { x: 1.42, r: 0.78, z0: -3.20, z1: 9.30 };
export const FIN = { x: 1.95, cant: 12, root: 4.30, tip: 7.40, height: 2.90, chordTip: 1.55 };
export const STAB = { x0: 1.15, z0: 6.40, span: 3.55, chordRoot: 2.30, chordTip: 0.95, sweep: 42 };
export const CANOPY = { z0: -6.60, z1: -4.20, w: 0.78, h: 0.52 };

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
