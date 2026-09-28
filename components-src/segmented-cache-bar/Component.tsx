import { useEffect, useRef, useState } from 'react';

const SHARDS = 16;
const WORKERS = 4;
type Seg = 'idle' | 'run' | 'done' | 'miss';

export default function SegmentedCacheBar() {
  const [segs, setSegs] = useState<Seg[]>(Array(SHARDS).fill('idle'));
  const [lanes, setLanes] = useState<string[]>(Array(WORKERS).fill('idle'));
  const [elapsed, setElapsed] = useState('0.0s');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;
    let t0 = 0;

    const stop = () => { for (const t of timers) clearTimeout(t); timers.length = 0; cancelAnimationFrame(raf); };

    const start = () => {
      stop();
      t0 = performance.now();
      setSegs(Array(SHARDS).fill('idle'));
      setLanes(Array(WORKERS).fill('idle'));

      const tick = () => {
        setElapsed(`${((performance.now() - t0) / 1000).toFixed(1)}s`);
        raf = requestAnimationFrame(tick);
      };
      tick();

      /* A SHARED QUEUE: each worker takes the next shard when it frees up, so
         completion order depends on shard cost — exactly like the real thing.
         Round-robin assignment is the natural thing to write and produces an
         even, regular fill that shows no concurrency at all. */
      let next = 0;
      let settled = 0;
      const pump = (w: number) => {
        if (next >= SHARDS) { setLanes((l) => l.map((v, i) => (i === w ? 'drained' : v))); return; }
        const i = next++;
        setSegs((s) => s.map((v, j) => (j === i ? 'run' : v)));
        setLanes((l) => l.map((v, k) => (k === w ? `shard ${i}` : v)));
        const cost = 180 + Math.random() * 900;
        timers.push(setTimeout(() => {
          setSegs((s) => s.map((v, j) => (j === i ? (Math.random() < 0.18 ? 'miss' : 'done') : v)));
          settled++;
          if (settled === SHARDS) {
            cancelAnimationFrame(raf);
            setLanes((l) => l.map((v, k) => (k === w ? 'drained' : v)));
            timers.push(setTimeout(start, 2200));
            return;
          }
          pump(w);
        }, cost));
      };
      for (let w = 0; w < WORKERS; w++) pump(w);
    };

    // A demo that keeps timers alive off-screen is a leak.
    const io = new IntersectionObserver((es) => {
      for (const e of es) { if (e.isIntersecting) start(); else stop(); }
    }, { rootMargin: '80px' });
    io.observe(el);
    return () => { stop(); io.disconnect(); };
  }, []);

  const settled = segs.filter((s) => s === 'done' || s === 'miss').length;
  const pct = Math.round((settled / SHARDS) * 100);

  return (
    <div ref={rootRef} className="grid gap-2">
      <div className="flex items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">Warming cache</p>
        <p className="m-0 font-mono text-[.68rem] tabular-nums text-text-dim">
          {settled}/{SHARDS} shards<span className="mx-1.5 opacity-50">·</span>{elapsed}
        </p>
      </div>

      {/* One element per shard, not one bar with a width. A width can only say
          how much is done — never which parts, nor that three came back a miss. */}
      <div
        role="progressbar"
        aria-label="Cache warm progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="grid h-4 auto-cols-fr grid-flow-col gap-0.5 rounded-[7px] border border-border bg-bg p-0.5"
      >
        {segs.map((s, i) => (
          <div
            key={i}
            title={`shard ${i}${s === 'idle' || s === 'run' ? '' : ` — ${s}`}`}
            className={`scb-seg rounded-sm ${
              s === 'done' ? 'bg-accent'
              : s === 'run' ? 'scb-pulse bg-[color-mix(in_oklab,var(--accent)_30%,transparent)]'
              : s === 'miss' ? 'scb-miss'
              : 'bg-[color-mix(in_oklab,var(--border)_55%,transparent)]'
            }`}
          />
        ))}
      </div>

      <ol className="m-0 grid list-none gap-[3px] p-0">
        {lanes.map((v, w) => (
          <li key={w} className="grid grid-cols-[4.2rem_1fr] items-center gap-2 font-mono text-[.62rem] text-text-dim">
            <span>worker {w}</span>
            <span className="truncate text-text">{v}</span>
          </li>
        ))}
      </ol>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        Four workers, sixteen shards, taken off a shared queue. Segments light where they land — the
        gaps are real concurrency, not a stalled animation.
      </p>
    </div>
  );
}
