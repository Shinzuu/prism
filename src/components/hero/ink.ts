/* Line work for the airframe.

   Two passes over the same edges give the hidden-line look a drawing has:
   the visible pass draws where the edge is in front of the solid, and the
   occluded pass draws the rest faintly and dashed. The solids themselves are
   rendered first with colorWrite off, purely to fill the depth buffer. */
import type * as THREE_NS from 'three';
import type * as ThreeMin from './three-min';
import type { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { alongBody } from './model';

type T = typeof ThreeMin;

export interface Ink {
  visible: LineSegments2;
  hidden: LineSegments2;
  materials: LineMaterial[];
  /** 0 draws nothing, 1 draws the whole aircraft, nose first. */
  setProgress(p: number): void;
  setColours(ink: [number, number, number], faint: [number, number, number]): void;
  setResolution(w: number, h: number): void;
  dispose(): void;
}

/* Patch the line shader with a nose-to-tail coordinate so the drawing grows
   along the aircraft instead of fading in. LineMaterial has no such hook, and
   an opacity tween would look like a dissolve rather than a pen. */
function drawOn(mat: LineMaterial) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uProgress = { value: 1 };
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'attribute float aAlong;\nvarying float vAlong;\nvoid main() {')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\n  vAlong = aAlong;');
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uProgress;\nvarying float vAlong;\nvoid main() {')
      .replace('#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\n  if ( vAlong > uProgress ) discard;');
    (mat as unknown as { userData: { shader?: unknown } }).userData.shader = shader;
  };
  mat.customProgramCacheKey = () => 'prism-drawon';
}

export async function makeInk(
  THREE: T,
  solids: THREE_NS.Mesh[],
  creaseDeg: number,
): Promise<Ink> {
  const [{ LineSegments2 }, { LineSegmentsGeometry }, { LineMaterial }] = await Promise.all([
    import('three/examples/jsm/lines/LineSegments2.js'),
    import('three/examples/jsm/lines/LineSegmentsGeometry.js'),
    import('three/examples/jsm/lines/LineMaterial.js'),
  ]);

  /* One merged edge set for the whole aircraft: a LineSegments2 per part would
     be a draw call per part and a resolution uniform per part to keep in step. */
  const pts: number[] = [];
  const along: number[] = [];
  const v = new THREE.Vector3();

  for (const mesh of solids) {
    mesh.updateWorldMatrix(true, false);
    const edges = new THREE.EdgesGeometry(mesh.geometry, creaseDeg);
    const p = edges.getAttribute('position');
    for (let i = 0; i < p.count; i += 2) {
      const a = v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld).clone();
      const b = v.fromBufferAttribute(p, i + 1).applyMatrix4(mesh.matrixWorld).clone();
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      /* One value per segment, taken at its midpoint, so a segment appears or
         does not — a segment that half appears reads as a rendering fault. */
      const t = alongBody((a.z + b.z) / 2);
      along.push(t, t);
    }
    edges.dispose();
  }

  const geom = new LineSegmentsGeometry();
  geom.setPositions(pts);
  geom.setAttribute(
    'aAlong',
    new THREE.InstancedBufferAttribute(new Float32Array(along), 1),
  );

  const base = { linewidth: 1.4, worldUnits: false, transparent: true } as const;

  const visible = new LineMaterial({ ...base, opacity: 1 });
  visible.depthTest = true;
  drawOn(visible);

  const hidden = new LineMaterial({ ...base, opacity: 0.13, dashed: true, dashSize: 0.08, gapSize: 0.26 });
  hidden.depthTest = true;
  /* Only where something is already in front: this is what makes it a hidden
     line rather than a second copy of the visible one. */
  hidden.depthFunc = THREE.GreaterDepth;
  hidden.linewidth = 1;
  drawOn(hidden);

  const lineVisible = new LineSegments2(geom, visible);
  const lineHidden = new LineSegments2(geom, hidden);
  lineVisible.computeLineDistances();
  lineHidden.computeLineDistances();
  lineVisible.renderOrder = 2;
  lineHidden.renderOrder = 1;

  const materials = [visible, hidden];
  const uni = (m: LineMaterial) =>
    (m as unknown as { userData: { shader?: { uniforms: Record<string, { value: number }> } } })
      .userData.shader?.uniforms;

  return {
    visible: lineVisible,
    hidden: lineHidden,
    materials,
    setProgress(p) {
      for (const m of materials) {
        const u = uni(m);
        if (u?.uProgress) u.uProgress.value = p;
      }
    },
    setColours(ink, faint) {
      visible.color.setRGB(ink[0], ink[1], ink[2]);
      hidden.color.setRGB(faint[0], faint[1], faint[2]);
    },
    setResolution(w, h) {
      for (const m of materials) m.resolution.set(w, h);
    },
    dispose() {
      geom.dispose();
      for (const m of materials) m.dispose();
    },
  };
}
