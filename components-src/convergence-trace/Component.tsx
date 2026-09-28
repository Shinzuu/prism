import { useEffect, useRef, useState } from 'react';

const W = 300, H = 96, PAD = 6;
const TOP = 1, FLOOR = 1e-7, TARGET = 1e-6, MAX = 44;

/* Map a residual to a y pixel through its LOG. Linear would put every value
   after the second iteration inside one pixel of the bottom edge — blank
   precisely during the long tail anyone is waiting through. */
const y = (r: number) => PAD + (Math.log10(Math.max(r, FLOOR)) / Math.log10(FLOOR / TOP)) * (H - PAD * 2);
const x = (n: number) => PAD + (n / (MAX - 1)) * (W - PAD * 2);

export default function ConvergenceTrace() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pts, setPts] = useState<number[]>([]);
  const [state, setState] = useState<'running' | 'stalled' | 'done'>('running');
  const [eta, setEta] = useState('estimating');
  const [note, setNote] = useState('The slope gives an estimate a spinner cannot. A flat trace means stalled, not working.');

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    let res = 0.8, i = 0, list: number[] = [];

    const step = () => {
      // A real solver: fast, then a stall, then it breaks through.
      const rate = i > 13 && i < 24 ? 0.985 : 0.62;
      res *= rate * (0.94 + Math.random() * 0.12);
      list = [...list, res];
      i++;
      setPts(list);

      /* Least-squares over the last eight points IN LOG SPACE. A converging
         solver is a straight line only after the log transform; fitting raw
         values chases a curve and the estimate swings and goes negative. */
      const tail = list.slice(-8);
      if (tail.length >= 4) {
        const n0 = list.length - tail.length;
        const xs = tail.map((_, k) => n0 + k);
        const ys = tail.map((r) => Math.log10(Math.max(r, FLOOR)));
        const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
        const my = ys.reduce((a, b) => a + b, 0) / ys.length;
        let num = 0, den = 0;
        xs.forEach((xv, k) => { num += (xv - mx) * (ys[k]! - my); den += (xv - mx) ** 2; });
        const slope = den ? num / den : 0;
        const stalled = slope > -0.02;      // decades per iteration
        const left = stalled ? Infinity : (Math.log10(TARGET) - Math.log10(res)) / slope;
        setState(res <= TARGET ? 'done' : stalled ? 'stalled' : 'running');
        setEta(res <= TARGET ? 'converged' : stalled ? 'stalled — slope flat' : `~${Math.max(1, Math.ceil(left))} iterations left`);
      }

      if (res <= TARGET || list.length >= MAX) {
        setNote(res <= TARGET
          ? 'Converged. The dashed line was the extrapolation from the log slope.'
          : 'Ran out of iterations — the flat stretch is visible, not hidden.');
        timer = setTimeout(() => { res = 0.8; i = 0; list = []; setPts([]); setNote(''); step(); }, 2200);
        return;
      }
      // setTimeout, not rAF: iterations are events, not frames.
      timer = setTimeout(step, 150);
    };

    const io = new IntersectionObserver((es) => {
      for (const e of es) { clearTimeout(timer); if (e.isIntersecting) timer = setTimeout(step, 150); }
    }, { rootMargin: '80px' });
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, []);

  const last = pts[pts.length - 1];
  const d = pts.map((r, n) => `${n ? 'L' : 'M'}${x(n)} ${y(r)}`).join(' ');

  return (
    <div ref={rootRef} className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">Solving <span className="font-normal text-text-dim">— residual</span></p>
        <p className="m-0 font-mono text-[.7rem] tabular-nums text-text-dim">
          {last ? last.toExponential(1) : '—'}<span className="mx-1.5 opacity-50">·</span>{eta}
        </p>
      </div>

      <div className="grid grid-cols-[2.4rem_1fr] items-stretch gap-1">
        {/* Decades label the VERTICAL axis, so they sit beside the plot. In a
            row underneath they read as if residual were the x variable. */}
        <div aria-hidden className="flex flex-col justify-between py-0.5 text-end font-mono text-[.58rem] text-text-dim">
          <span>1e0</span><span>1e-3</span><span>1e-6</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
             aria-label="Residual falling on a logarithmic axis"
             className="block h-24 w-full rounded-lg border border-border bg-bg">
          <g>
            {[1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6].map((dec) => (
              <line key={dec} x1={0} x2={W} y1={y(dec)} y2={y(dec)} className="ct-grid" />
            ))}
          </g>
          {last && state !== 'done' && (
            <path className="ct-fit" fill="none"
              d={`M${x(pts.length - 1)} ${y(last)} L${x(Math.min(MAX - 1, pts.length + 8))} ${y(state === 'stalled' ? last : TARGET)}`} />
          )}
          <path className={`ct-line ${state === 'stalled' ? 'ct-dim' : ''}`} fill="none" d={d} />
          {last && <circle className={`ct-dot ${state === 'stalled' ? 'ct-dim-fill' : ''}`} r="2.6" cx={x(pts.length - 1)} cy={y(last)} />}
        </svg>
      </div>

      <p aria-hidden className="m-0 ms-[2.8rem] font-mono text-[.58rem] text-text-dim">iteration →</p>
      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">{note}</p>
    </div>
  );
}
