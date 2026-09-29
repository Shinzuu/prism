import { useEffect, useRef, useState } from 'react';
import {
  CALLOUTS, LENGTH, PANEL, PIVOT_X, PIVOT_Z, SWEEP_MAX, SWEEP_MIN, spanAt,
} from './spec';

/* Tuning knobs, all in one place — see the note in README-hero.md.
   Crease angle decides how much panel detail survives; too low and the lofted
   body turns into triangle soup, too high and the drawing loses its panel
   lines. */
const CREASE_DEG = 18;
const DRAW_SECONDS = 2.6;
const SWEEP_SECONDS = 2.2;
const IDLE_YAW_DEG = 5;
const PARALLAX_DEG = 3;
const DPR_CAP = 2;

type Vec = { x: number; y: number };

/* Read a design token off the document and resolve it to bytes.

   The palette is in OKLCH. three's Color.set() understands hex, rgb(), hsl()
   and the named colours, and nothing else — handed an oklch() string it leaves
   the material at its default, which is white, and every line silently
   disappears into the page. Painting one pixel and reading it back makes the
   browser do the conversion, and it works for whatever colour space the
   tokens move to next. */
/* Created on first use, not at module scope: this component is server-rendered
   for the fallback markup, and there is no document during the build. */
let probeCtx: CanvasRenderingContext2D | null | undefined;

function token(name: string): [number, number, number] {
  if (probeCtx === undefined) {
    const probe = document.createElement('canvas');
    probe.width = probe.height = 1;
    probeCtx = probe.getContext('2d', { willReadFrequently: true });
  }
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!probeCtx || !v) return [0, 0, 0];
  probeCtx.clearRect(0, 0, 1, 1);
  probeCtx.fillStyle = '#000';
  probeCtx.fillStyle = v;
  probeCtx.fillRect(0, 0, 1, 1);
  const d = probeCtx.getImageData(0, 0, 1, 1).data;
  return [d[0]! / 255, d[1]! / 255, d[2]! / 255];
}

export default function Airframe() {
  const host = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [span, setSpan] = useState(spanAt(SWEEP_MIN));
  const [sweep, setSweep] = useState(SWEEP_MIN);
  const [marks, setMarks] = useState<Array<{ id: string; text: string; at: Vec; to: Vec; on: boolean; end: boolean }>>(
    CALLOUTS.map((c) => ({ id: c.id, text: c.text, at: { x: -999, y: -999 }, to: { x: -999, y: -999 }, on: false, end: false })),
  );
  const [tips, setTips] = useState<{ a: Vec; b: Vec } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stop = false;
    let teardown: (() => void) | null = null;

    (async () => {
      /* Everything heavy is behind this await, so a visitor who never reaches
         the hero never downloads it. */
      const THREE = await import('./three-min');
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      const { buildAirframe } = await import('./model');
      const { makeInk } = await import('./ink');
      if (stop) return;

      const canvas = document.createElement('canvas');
      canvas.className = 'af__canvas';
      el.prepend(canvas);

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch {
        /* No WebGL: leave the SVG sheet in place rather than showing a hole. */
        canvas.remove();
        return;
      }
      renderer.setPixelRatio(Math.min(DPR_CAP, window.devicePixelRatio || 1));

      const scene = new THREE.Scene();
      const { root, solids, wings } = buildAirframe(THREE);
      /* Drawn nose-left, the way the elevation on the sheet is drawn. */
      root.rotation.y = Math.PI / 2;
      scene.add(root);

      /* Depth only. The solids are never seen; they exist so the line pass can
         tell a visible edge from an occluded one. */
      const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false });
      depthMat.polygonOffset = true;
      depthMat.polygonOffsetFactor = 1;
      depthMat.polygonOffsetUnits = 1;
      for (const m of solids) m.material = depthMat;

      const ink = await makeInk(THREE, solids, CREASE_DEG);
      if (stop) { renderer.dispose(); canvas.remove(); return; }
      scene.add(ink.hidden, ink.visible);

      /* Two cameras, one render matrix. Cutting from an orthographic plan to a
         perspective three-quarter is a jump; lerping the projection matrices
         is the only way the transition reads as one move. */
      const persp = new THREE.PerspectiveCamera(32, 1, 0.5, 200);
      const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 200);
      const cam = new THREE.PerspectiveCamera(32, 1, 0.5, 200);
      const mA = new THREE.Matrix4();
      const mB = new THREE.Matrix4();

      /* Fitted, not guessed: the unswept span is wider than the aircraft is
         long, so a distance that frames the side view crops the plan. */
      const REACH = Math.max(LENGTH, spanAt(SWEEP_MIN)) * 0.62;
      const state = { blend: 0, progress: 0, sweep: SWEEP_MIN, yaw: 0, px: 0, py: 0, dist: 40 };
      const pointer = { x: 0, y: 0 };

      function resize() {
        const w = el!.clientWidth;
        const h = el!.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        ink.setResolution(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
        const aspect = w / h;
        persp.aspect = aspect;
        persp.updateProjectionMatrix();
        /* Frame the longest dimension in whichever screen axis is tighter. */
        const halfH = aspect >= 1 ? REACH : REACH / aspect;
        const halfW = halfH * aspect;
        state.dist = (REACH / Math.tan((persp.fov * Math.PI) / 360)) / Math.min(1, aspect);
        ortho.left = -halfW; ortho.right = halfW; ortho.top = halfH; ortho.bottom = -halfH;
        ortho.updateProjectionMatrix();
      }

      function paint() {
        /* Camera path: straight down on the plan, easing out to three-quarter. */
        const b = state.blend;
        const yaw = (state.yaw + state.px * PARALLAX_DEG) * (Math.PI / 180);
        const dist = state.dist;
        const el0 = THREE.MathUtils.lerp(89, 30 + state.py * PARALLAX_DEG, b) * (Math.PI / 180);
        const az = THREE.MathUtils.lerp(0, -40, b) * (Math.PI / 180) + yaw;
        cam.position.set(
          Math.cos(el0) * Math.sin(az) * dist,
          Math.sin(el0) * dist,
          Math.cos(el0) * Math.cos(az) * dist,
        );
        cam.up.set(0, b > 0.5 ? 1 : 1, 0);
        cam.lookAt(0, 0, 0);

        persp.position.copy(cam.position);
        persp.quaternion.copy(cam.quaternion);
        ortho.position.copy(cam.position);
        ortho.quaternion.copy(cam.quaternion);
        mA.copy(ortho.projectionMatrix);
        mB.copy(persp.projectionMatrix);
        for (let i = 0; i < 16; i++) {
          cam.projectionMatrix.elements[i] = THREE.MathUtils.lerp(mA.elements[i]!, mB.elements[i]!, b);
        }
        cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

        const s = (state.sweep - SWEEP_MIN) * (Math.PI / 180);
        wings[0]!.rotation.y = -s;
        wings[1]!.rotation.y = s;

        ink.setProgress(state.progress);
        renderer.render(scene, cam);
      }

      /* Labels live in the DOM, not the canvas: they have to be selectable,
         readable by a screen reader, and set in the page's own type. */
      const v = new THREE.Vector3();
      const project = (x: number, y: number, z: number): Vec => {
        v.set(x, y, z).applyMatrix4(root.matrixWorld).project(cam);
        return { x: ((v.x + 1) / 2) * el!.clientWidth, y: ((1 - v.y) / 2) * el!.clientHeight };
      };

      function syncLabels(shown: number) {
        root.updateWorldMatrix(true, true);
        const w = el!.clientWidth;
        const h = el!.clientHeight;
        /* Fan the labels down a column on each side. A fixed offset from the
           anchor puts two labels on top of each other whenever two anchors
           project close together, which they do for most of the timeline. */
        let left = 0;
        let right = 0;
        setMarks(CALLOUTS.map((c, i) => {
          const at = project(c.at[0], c.at[1], c.at[2]);
          const onRight = at.x > w * 0.42;
          const row = onRight ? right++ : left++;
          /* Anchored to the edge of the plate, not to a fraction of it: a
             label placed at 78% and then allowed to run right is clipped the
             moment the text is long, which is most of them. */
          const to = {
            x: onRight ? w - 2 : 2,
            y: Math.max(14, Math.min(h - 14, h * 0.10 + row * 26)),
          };
          return { id: c.id, text: c.text, at, to, on: i < shown, end: onRight };
        }));
        /* The dimension is drawn between the actual wing tips, so it moves
           with the sweep rather than being redrawn to match a number. */
        const s = (state.sweep - SWEEP_MIN) * (Math.PI / 180);
        const tipX = PIVOT_X + PANEL * Math.cos(s);
        const tipZ = PIVOT_Z + PANEL * Math.sin(s);
        setTips({ a: project(-tipX, 0, tipZ), b: project(tipX, 0, tipZ) });
        setSpan(spanAt(state.sweep));
        setSweep(state.sweep);
      }

      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el!);

      const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

      const theme = () => {
        const inkRGB = token('--text');
        const faint = token('--text-dim');
        ink.setColours(inkRGB, faint);
        /* Published on the element so a test can see what the palette actually
           resolved to. The failure this guards against — a colour string three
           cannot parse, leaving every line white — looks identical in the DOM
           and nearly identical in a screenshot, because the drafting grid
           behind the transparent canvas dominates the pixels either way. */
        el!.dataset.ink = inkRGB.map((c) => Math.round(c * 255)).join(',');
        el!.dataset.ground = token('--bg').map((c) => Math.round(c * 255)).join(',');
      };
      theme();
      const themeObs = new MutationObserver(theme);
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      addEventListener('prism:theme', theme);

      /* Only run while the drawing is on screen and the tab is in front. */
      let onScreen = true;
      let raf = 0;
      const io = new IntersectionObserver(([e]) => { onScreen = !!e?.isIntersecting; }, { threshold: 0.01 });
      io.observe(el!);

      let last = performance.now();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!onScreen || document.hidden) return;
        const now = performance.now();
        /* Clamped so a backgrounded tab does not resume with one huge step. */
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!REDUCED) {
          state.yaw = Math.sin(now / 5200) * IDLE_YAW_DEG;
          state.px += (pointer.x - state.px) * Math.min(1, dt * 4);
          state.py += (pointer.y - state.py) * Math.min(1, dt * 4);
        }
        paint();
      };

      const move = (e: PointerEvent) => {
        const r = el!.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointer.y = ((e.clientY - r.top) / r.height - 0.5) * -2;
      };
      addEventListener('pointermove', move, { passive: true });

      setLive(true);

      let tl: gsap.core.Timeline | null = null;
      let st: ScrollTrigger | null = null;

      if (REDUCED) {
        /* The finished drawing, no sweep, no drift. */
        state.blend = 1; state.progress = 1; state.sweep = SWEEP_MAX * 0.5 + SWEEP_MIN * 0.5;
        paint(); syncLabels(CALLOUTS.length);
      } else {
        raf = requestAnimationFrame(loop);
        tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: () => syncLabels(shownRef.current) });
        tl.to(state, { progress: 1, duration: DRAW_SECONDS, ease: 'none' }, 0)
          .to(state, { blend: 1, duration: 1.8 }, DRAW_SECONDS * 0.55)
          .to(state, { sweep: SWEEP_MAX, duration: SWEEP_SECONDS }, DRAW_SECONDS * 0.8)
          .to(state, { sweep: SWEEP_MIN, duration: SWEEP_SECONDS }, DRAW_SECONDS * 0.8 + SWEEP_SECONDS);

        CALLOUTS.forEach((_, i) => {
          tl!.add(() => { shownRef.current = i + 1; syncLabels(i + 1); }, DRAW_SECONDS * 0.9 + i * 0.28);
        });

        /* Scrolling past the hero sweeps the wings, so the mechanism the sheet
           documents is the thing the scroll drives. */
        st = ScrollTrigger.create({
          trigger: el!,
          start: 'top top',
          end: 'bottom top',
          onUpdate: (self) => {
            if (tl && tl.progress() < 1) return;
            state.sweep = SWEEP_MIN + (SWEEP_MAX - SWEEP_MIN) * self.progress;
            syncLabels(CALLOUTS.length);
          },
        });
      }

      teardown = () => {
        cancelAnimationFrame(raf);
        tl?.kill();
        st?.kill();
        io.disconnect();
        ro.disconnect();
        themeObs.disconnect();
        removeEventListener('prism:theme', theme);
        removeEventListener('pointermove', move);
        ink.dispose();
        renderer.dispose();
        canvas.remove();
      };
    })();

    return () => { stop = true; teardown?.(); };
  }, []);

  const shownRef = useRef(0);

  return (
    <div ref={host} className={`af${live ? ' af--live' : ''}`} aria-hidden="true">
      <svg className="af__over" aria-hidden="true">
        {tips && (
          <g className="af__dim">
            <line x1={tips.a.x} y1={tips.a.y} x2={tips.b.x} y2={tips.b.y} />
            <circle cx={tips.a.x} cy={tips.a.y} r="2.5" />
            <circle cx={tips.b.x} cy={tips.b.y} r="2.5" />
          </g>
        )}
        {marks.filter((m) => m.on).map((m) => (
          <line key={m.id} className="af__lead" x1={m.at.x} y1={m.at.y} x2={m.to.x} y2={m.to.y} />
        ))}
      </svg>

      {tips && (
        <p className="af__span">
          <b>{span.toFixed(2)} m</b> <span>{Math.round(sweep)}° sweep</span>
        </p>
      )}

      {marks.filter((m) => m.on).map((m) => (
        <p
          key={m.id}
          className={`af__note${m.end ? ' af__note--end' : ''}`}
          style={{ left: `${m.to.x}px`, top: `${m.to.y}px` }}
        >
          <i>{m.id}</i> {m.text}
        </p>
      ))}
    </div>
  );
}
