import { useEffect, useRef, useState } from 'react';

const W = 300, H = 96, PAD = 6;
const TOP = 1, FLOOR = 1e-7;
const DEFAULT_INTRO = 'The slope gives an estimate a spinner cannot. A flat trace means stalled, not working.';
const DEFAULT_CONVERGED = 'Converged. The dashed line was the extrapolation from the log slope.';
const DEFAULT_EXHAUSTED = 'Ran out of iterations — the flat stretch is visible, not hidden.';

/* Map a residual to a y pixel through its LOG. Linear would put every value
   after the second iteration inside one pixel of the bottom edge — blank
   precisely during the long tail anyone is waiting through. */
const y = (r: number) => PAD + (Math.log10(Math.max(r, FLOOR)) / Math.log10(FLOOR / TOP)) * (H - PAD * 2);

export type ConvergenceResult = { converged: boolean; iterations: number; residual: number };

export interface ConvergenceTraceProps {
  /** Heading above the plot. */
  title?: string;
  /** Dimmed qualifier after the heading. */
  subtitle?: string;
  /** Residual at which the run counts as converged; keep it between 1e-7 and 1. */
  target?: number;
  /** Iterations before the run gives up; also sets the width of the x axis. */
  maxIterations?: number;
  /** Delay between iterations, in milliseconds. */
  stepMs?: number;
  /** Pause before the demo run restarts, in milliseconds. */
  restartDelayMs?: number;
  /** Caption shown while the first run is in progress. */
  introNote?: string;
  /** Caption shown when a run reaches the target. */
  convergedNote?: string;
  /** Caption shown when a run hits the iteration limit. */
  exhaustedNote?: string;
  /** Called each time a run ends, converged or not. */
  onFinish?: (result: ConvergenceResult) => void;
  /** Extra classes for the root element. */
  className?: string;
}

export default function ConvergenceTrace({
  title = 'Solving',
  subtitle = 'residual',
  target = 1e-6,
  maxIterations = 44,
  stepMs = 150,
  restartDelayMs = 2200,
  introNote = DEFAULT_INTRO,
  convergedNote = DEFAULT_CONVERGED,
  exhaustedNote = DEFAULT_EXHAUSTED,
  onFinish,
  className = '',
}: ConvergenceTraceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pts, setPts] = useState<number[]>([]);
  const [state, setState] = useState<'running' | 'stalled' | 'done'>('running');
  const [eta, setEta] = useState('estimating');
  const [note, setNote] = useState(introNote);
  // A ref, so a parent passing an inline callback does not restart the run.
  const finishRef = useRef(onFinish);
  useEffect(() => { finishRef.current = onFinish; });

  const MAX = maxIterations;
  const x = (n: number) => PAD + (n / (MAX - 1)) * (W - PAD * 2);

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
        const left = stalled ? Infinity : (Math.log10(target) - Math.log10(res)) / slope;
        setState(res <= target ? 'done' : stalled ? 'stalled' : 'running');
        setEta(res <= target ? 'converged' : stalled ? 'stalled — slope flat' : `~${Math.max(1, Math.ceil(left))} iterations left`);
      }

      if (res <= target || list.length >= maxIterations) {
        setNote(res <= target ? convergedNote : exhaustedNote);
        finishRef.current?.({ converged: res <= target, iterations: list.length, residual: res });
        timer = setTimeout(() => { res = 0.8; i = 0; list = []; setPts([]); setNote(''); step(); }, restartDelayMs);
        return;
      }
      // setTimeout, not rAF: iterations are events, not frames.
      timer = setTimeout(step, stepMs);
    };

    const io = new IntersectionObserver((es) => {
      for (const e of es) { clearTimeout(timer); if (e.isIntersecting) timer = setTimeout(step, stepMs); }
    }, { rootMargin: '80px' });
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, [target, maxIterations, stepMs, restartDelayMs, convergedNote, exhaustedNote]);

  const last = pts[pts.length - 1];
  const d = pts.map((r, n) => `${n ? 'L' : 'M'}${x(n)} ${y(r)}`).join(' ');

  return (
    <div ref={rootRef} className={`grid gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">{title} <span className="font-normal text-text-dim">— {subtitle}</span></p>
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
              d={`M${x(pts.length - 1)} ${y(last)} L${x(Math.min(MAX - 1, pts.length + 8))} ${y(state === 'stalled' ? last : target)}`} />
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
