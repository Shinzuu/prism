/* The airframe, built in code from the numbers in spec.ts.

   No downloaded model: a glTF would be another asset to ship, another licence
   to carry, and it could not be driven by the published dimensions the title
   block quotes. Everything here is lofted or extruded from those numbers, so
   changing a figure in spec.ts changes the drawing. */
import type * as THREE_NS from 'three';
import type * as ThreeMin from './three-min';
import {
  STATIONS, NACELLE, FIN, STAB, CANOPY, PANEL, PIVOT_X, PIVOT_Z, LENGTH,
} from './spec';

type T = typeof ThreeMin;

/** One lofted cross-section: a superellipse whose boxiness is per-station. */
function section(w: number, top: number, bot: number, flat: number, k = 24) {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const e = 2 / flat;
    const h = s >= 0 ? top : Math.abs(bot);
    pts.push([
      Math.sign(c) * Math.pow(Math.abs(c), e) * w,
      Math.sign(s) * Math.pow(Math.abs(s), e) * h,
    ]);
  }
  return pts;
}

/** Skin a list of same-length rings into a closed solid. */
function loft(THREE: T, rings: Array<Array<[number, number]>>, zs: number[]) {
  const k = rings[0]!.length;
  const pos: number[] = [];
  const push = (a: number[], b: number[], c: number[]) => pos.push(...a, ...b, ...c);
  const v = (ri: number, i: number) => {
    const p = rings[ri]![i % k]!;
    return [p[0], p[1], zs[ri]!];
  };

  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < k; i++) {
      const a = v(r, i), b = v(r, i + 1), c = v(r + 1, i + 1), d = v(r + 1, i);
      push(a, b, c);
      push(a, c, d);
    }
  }
  /* Flat caps at both ends, so the depth prepass is watertight — an open end
     lets the hidden-line pass see straight through the aircraft. */
  for (const [ri, flip] of [[0, true], [rings.length - 1, false]] as const) {
    const cz = zs[ri]!;
    let cx = 0, cy = 0;
    for (const p of rings[ri]!) { cx += p[0]; cy += p[1]; }
    cx /= k; cy /= k;
    for (let i = 0; i < k; i++) {
      const a = v(ri, i), b = v(ri, i + 1);
      if (flip) push([cx, cy, cz], b, a); else push([cx, cy, cz], a, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Extrude a planform outline (x, z) to a thickness in y. */
function plate(THREE: T, outline: Array<[number, number]>, thick: number | ((i: number) => number)) {
  const n = outline.length;
  const t = (i: number) => (typeof thick === 'number' ? thick : thick(i)) / 2;
  const pos: number[] = [];
  const push = (a: number[], b: number[], c: number[]) => pos.push(...a, ...b, ...c);
  const up = (i: number) => [outline[i]![0], t(i), outline[i]![1]];
  const dn = (i: number) => [outline[i]![0], -t(i), outline[i]![1]];

  for (let i = 1; i < n - 1; i++) {
    push(up(0), up(i), up(i + 1));
    push(dn(0), dn(i + 1), dn(i));
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    push(up(i), dn(i), dn(j));
    push(up(i), dn(j), up(j));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export interface Airframe {
  root: THREE_NS.Group;
  /** Every solid, for the depth prepass and for edge extraction. */
  solids: THREE_NS.Mesh[];
  /** The two wing panels, which pivot. Everything else is fixed. */
  wings: THREE_NS.Group[];
}

export function buildAirframe(THREE: T): Airframe {
  const root = new THREE.Group();
  const solids: THREE_NS.Mesh[] = [];
  const mat = new THREE.MeshBasicMaterial();

  const add = (g: THREE_NS.BufferGeometry, parent: THREE_NS.Object3D = root) => {
    const m = new THREE.Mesh(g, mat);
    parent.add(m);
    solids.push(m);
    return m;
  };

  /* Body ------------------------------------------------------------------ */
  add(loft(
    THREE,
    STATIONS.map((s) => section(s.w, s.top, s.bot, s.flat)),
    STATIONS.map((s) => s.z),
  ));

  /* Nacelles -------------------------------------------------------------- */
  for (const sx of [-1, 1]) {
    const zs = [NACELLE.z0, NACELLE.z0 + 2, 0, 4, 7, NACELLE.z1];
    const rs = [0.62, 0.74, NACELLE.r, NACELLE.r, 0.72, 0.58];
    const g = loft(THREE, rs.map((r) => section(r, r, -r, 2.2, 16)), zs);
    const m = add(g);
    m.position.x = sx * NACELLE.x;
  }

  /* Gloves: fixed leading-edge extensions out to the pivot ---------------- */
  for (const sx of [-1, 1]) {
    const g = plate(THREE, [
      [1.20, -3.90], [PIVOT_X, PIVOT_Z - 1.55], [PIVOT_X, PIVOT_Z + 1.90], [1.20, -0.60],
    ], 0.30);
    const m = add(g);
    m.scale.x = sx;
  }

  /* Wings: separate groups pivoting at the solved pivot station ------------ */
  const wings: THREE_NS.Group[] = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * PIVOT_X, 0, PIVOT_Z);
    root.add(pivot);
    const le = (x: number) => -1.45 + x * 0.10;
    const te = (x: number) => 1.90 - x * 0.18;
    const g = plate(THREE, [
      [0, le(0)], [PANEL, le(PANEL)], [PANEL, te(PANEL)], [0, te(0)],
    ], (i) => (i === 1 || i === 2 ? 0.07 : 0.17));
    const m = new THREE.Mesh(g, mat);
    m.scale.x = sx;
    pivot.add(m);
    solids.push(m);
    wings.push(pivot);
  }

  /* Fins: canted outward, twin ------------------------------------------- */
  for (const sx of [-1, 1]) {
    const g = plate(THREE, [
      [0, FIN.root], [FIN.height, FIN.root + 1.35],
      [FIN.height, FIN.root + 1.35 + FIN.chordTip], [0, FIN.tip],
    ], 0.16);
    const m = add(g);
    m.rotation.z = Math.PI / 2;
    m.rotation.y = 0;
    m.position.set(sx * FIN.x, 0.35, 0);
    m.rotation.x = 0;
    m.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 0);
    m.scale.set(1, sx, 1);
    m.rotation.z = sx * (Math.PI / 2 - (FIN.cant * Math.PI) / 180);
  }

  /* Stabilators ----------------------------------------------------------- */
  for (const sx of [-1, 1]) {
    const tipX = STAB.x0 + STAB.span;
    const off = Math.tan((STAB.sweep * Math.PI) / 180) * STAB.span;
    const g = plate(THREE, [
      [STAB.x0, STAB.z0], [tipX, STAB.z0 + off],
      [tipX, STAB.z0 + off + STAB.chordTip], [STAB.x0, STAB.z0 + STAB.chordRoot],
    ], 0.14);
    const m = add(g);
    m.scale.x = sx;
    m.position.y = -0.25;
  }

  /* Canopy ---------------------------------------------------------------- */
  {
    const zs = [CANOPY.z0, CANOPY.z0 + 0.7, (CANOPY.z0 + CANOPY.z1) / 2, CANOPY.z1 - 0.4, CANOPY.z1];
    const ws = [0.30, 0.68, CANOPY.w, 0.70, 0.36];
    const hs = [0.14, 0.42, CANOPY.h, 0.40, 0.12];
    const g = loft(THREE, ws.map((w, i) => section(w, hs[i]!, -0.02, 2.4, 16)), zs);
    const m = add(g);
    m.position.y = 0.82;
  }

  /* Ventral fins ---------------------------------------------------------- */
  for (const sx of [-1, 1]) {
    const g = plate(THREE, [[0, 7.10], [0.95, 7.70], [0.95, 8.60], [0, 8.60]], 0.10);
    const m = add(g);
    m.rotation.z = sx * (Math.PI / 2 + 0.35);
    m.position.set(sx * 1.35, -0.75, 0);
    m.scale.set(1, sx, 1);
  }

  return { root, solids, wings };
}

/** Nose-to-tail position of a point, 0 at the nose and 1 at the tail. */
export function alongBody(z: number): number {
  return Math.min(1, Math.max(0, (z + LENGTH / 2) / LENGTH));
}
