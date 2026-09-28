import { useEffect, useRef, useState } from 'react';

const DIMS = {
  region: ['us-east', 'us-west', 'eu-central', 'ap-south'],
  tier: ['free', 'pro', 'enterprise'],
  client: ['web', 'ios', 'android', 'cli'],
  cache: ['hit', 'miss'],
} as const;
type Point = { region: string; tier: string; client: string; cache: string; size: number; ms: number };
const W = 600, H = 260, MAXMS = 820, MAXSIZE = 940;

function makePoints(): Point[] {
  // Deterministic, so the demo tells the same story on every load.
  let seed = 20260928;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]!;
  return Array.from({ length: 1400 }, () => {
    const region = pick(DIMS.region), tier = pick(DIMS.tier), client = pick(DIMS.client), cache = pick(DIMS.cache);
    // The planted truth: ap-south on a cache miss is slow. Nothing says so.
    const slow = region === 'ap-south' && cache === 'miss' && rnd() < 0.72;
    const size = 20 + rnd() * 900;
    return { region, tier, client, cache, size, ms: slow ? 420 + rnd() * 380 : 40 + rnd() * 150 + size * 0.06 };
  });
}

export default function OutlierHeatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const pts = useRef<Point[]>([]);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [inside, setInside] = useState<Set<number>>(new Set());
  const [read, setRead] = useState('Drag a box around the slow cluster');

  if (!pts.current.length) pts.current = makePoints();
  const px = (p: Point) => 8 + (p.size / MAXSIZE) * (W - 16);
  const py = (p: Point) => H - 8 - (Math.min(p.ms, MAXMS) / MAXMS) * (H - 16);

  useEffect(() => {
    const c = canvasRef.current, host = plotRef.current;
    if (!c || !host) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    /* Read the tokens rather than hard-coding, so the canvas follows the
       palette. The fallback is the element's own resolved colour — never a
       literal, which would be a hole straight through the palette rule. */
    const cs = getComputedStyle(host);
    const dim = cs.getPropertyValue('--text-dim').trim() || cs.color;
    const acc = cs.getPropertyValue('--accent').trim() || cs.color;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < pts.current.length; i++) {
      const hit = inside.has(i);
      ctx.fillStyle = hit ? acc : dim;
      ctx.globalAlpha = hit ? 0.9 : inside.size ? 0.16 : 0.34;
      ctx.beginPath();
      ctx.arc(px(pts.current[i]!), py(pts.current[i]!), hit ? 2.4 : 1.8, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [inside]);

  /* Ranked by LIFT — the rate inside the box divided by the rate outside —
     never by raw count, which just re-ranks the most common values overall. */
  const ranks = (() => {
    if (inside.size < 12) return null;
    const rows: { key: string; lift: number }[] = [];
    for (const [dim, values] of Object.entries(DIMS)) {
      for (const value of values) {
        let hitIn = 0, hitOut = 0;
        pts.current.forEach((p, i) => {
          if ((p as never as Record<string, string>)[dim] !== value) return;
          if (inside.has(i)) hitIn++; else hitOut++;
        });
        const rIn = hitIn / inside.size;
        const rOut = hitOut / (pts.current.length - inside.size);
        // Drop values holding too little of the selection, and floor the
        // denominator: a value absent outside would otherwise score infinity.
        if (rIn < 0.08) continue;
        rows.push({ key: `${dim} = ${value}`, lift: rIn / Math.max(rOut, 1 / pts.current.length) });
      }
    }
    return rows.sort((a, b) => b.lift - a.lift).slice(0, 4);
  })();
  const cap = ranks ? Math.max(...ranks.map((r) => r.lift), 2) : 2;

  const local = (e: React.PointerEvent) => {
    const r = plotRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, r };
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">
          Request latency <span className="font-normal text-text-dim">— 1,400 requests</span>
        </p>
        <p className="m-0 font-mono text-[.68rem] tabular-nums text-text-dim">{read}</p>
      </div>

      <div
        ref={plotRef}
        tabIndex={0}
        role="application"
        aria-label="Latency scatter. Press Enter to select the slowest tenth of requests."
        className="relative cursor-crosshair touch-none overflow-hidden rounded-lg border border-border bg-bg"
        onPointerDown={(e) => { start.current = local(e); (e.target as HTMLElement).setPointerCapture(e.pointerId); e.preventDefault(); }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const p = local(e);
          const x0 = Math.min(start.current.x, p.x), x1 = Math.max(start.current.x, p.x);
          const y0 = Math.min(start.current.y, p.y), y1 = Math.max(start.current.y, p.y);
          const k = p.r.width / W;
          setSel({ x: x0 * k, y: y0 * k, w: (x1 - x0) * k, h: (y1 - y0) * k });
          const next = new Set<number>();
          pts.current.forEach((pt, i) => {
            const cx = px(pt), cy = py(pt);
            if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) next.add(i);
          });
          setInside(next);
          setRead(`${next.size} of ${pts.current.length} selected`);
        }}
        onPointerUp={() => { start.current = null; }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          const cut = [...pts.current].sort((a, b) => b.ms - a.ms)[Math.floor(pts.current.length * 0.1)]!.ms;
          const next = new Set<number>();
          pts.current.forEach((p, i) => { if (p.ms >= cut) next.add(i); });
          setSel(null); setInside(next);
          setRead(`${next.size} slowest requests selected`);
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} role="img"
                aria-label="Scatter of request latency against payload size"
                className="block h-auto w-full" />
        {sel && (
          <div className="pointer-events-none absolute rounded-sm border border-accent bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]"
               style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }} />
        )}
      </div>

      <ol aria-live="polite" className="m-0 grid min-h-[4.2rem] list-none gap-1 p-0">
        {ranks === null ? (
          <li><p className="m-0 text-[.72rem] text-text-dim">Too few points selected to rank anything honestly.</p></li>
        ) : ranks.map((r) => (
          <li key={r.key} className="grid grid-cols-[8.5rem_1fr_3.2rem] items-center gap-2 text-[.7rem]">
            <span className="truncate font-mono text-[.66rem] text-text-dim">{r.key}</span>
            <span className="h-2 overflow-hidden rounded bg-[color-mix(in_oklab,var(--border)_60%,transparent)]">
              <i className="block h-full rounded bg-accent" style={{ width: `${Math.round((r.lift / cap) * 100)}%` }} />
            </span>
            <span className="text-right font-mono text-[.66rem] tabular-nums">{r.lift.toFixed(1)}×</span>
          </li>
        ))}
      </ol>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        Lift is the rate inside the box divided by the rate outside. A tall bar means that value is
        over-represented among the slow requests.
      </p>
    </div>
  );
}
