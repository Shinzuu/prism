import { useEffect, useRef, useState } from 'react';

const START = 48;
const WINDOW = 5;   // samples kept for the rate
const TICK = 1400;

type Sample = { pos: number; t: number };

function human(secs: number) {
  if (secs < 60) return `${Math.round(secs)} seconds`;
  const m = Math.round(secs / 60);
  if (m < 60) return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  const h = Math.round(m / 10) / 6;
  return `${h} ${h === 1 ? 'hour' : 'hours'}`;
}

export interface QueuePositionProps {
  /** Position the queue starts from; also the 0% point of the progress bar. */
  start?: number;
  /** Live position from your backend. When set, the built-in simulation is off. */
  position?: number;
  /** Number of recent samples the rate is computed from. */
  sampleWindow?: number;
  /** Base delay between simulated moves, in ms. */
  tickMs?: number;
  /** Shows a waiting state while the first position is still unknown. */
  loading?: boolean;
  /** Text shown while loading. */
  loadingText?: string;
  /** Text shown once the position reaches zero. */
  readyText?: string;
  /** Text shown when the rate is too uneven to give an estimate. */
  unstableText?: string;
  /** Accessible name of the progress bar. */
  progressLabel?: string;
  /** Fired whenever the position changes. */
  onPositionChange?: (position: number) => void;
  /** Fired once when the position reaches zero. */
  onReady?: () => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function QueuePosition({
  start = START,
  position,
  sampleWindow = WINDOW,
  tickMs = TICK,
  loading = false,
  loadingText = 'Joining the queue…',
  readyText = 'Ready.',
  unstableText = 'The line is moving unevenly. No reliable estimate yet.',
  progressLabel = 'Queue progress',
  onPositionChange,
  onReady,
  className = '',
}: QueuePositionProps) {
  const controlled = position !== undefined;
  const [simPos, setPos] = useState(start);
  const pos = position ?? simPos;
  const samples = useRef<Sample[]>([{ pos, t: performance.now() }]);
  const announced = useRef<string | null>(null);
  const [status, setStatus] = useState('');
  // Bumped when a controlled position lands in the samples, so the rate re-reads them.
  const [, setSampled] = useState(0);
  const onChangeRef = useRef(onPositionChange);
  const onReadyRef = useRef(onReady);
  useEffect(() => { onChangeRef.current = onPositionChange; onReadyRef.current = onReady; });

  useEffect(() => {
    if (controlled || loading) return;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      setPos((p) => {
        if (p <= 0) return p;
        // A queue that advances perfectly evenly is a progress bar wearing a
        // costume; real ones stall.
        const move = Math.random() < 0.22 ? 0 : Math.ceil(Math.random() * 3);
        const next = Math.max(0, p - move);
        samples.current.push({ pos: next, t: performance.now() });
        if (samples.current.length > sampleWindow) samples.current.shift();
        if (next > 0) timer = setTimeout(step, tickMs + Math.random() * 900);
        return next;
      });
    };
    timer = setTimeout(step, tickMs);
    return () => clearTimeout(timer);
  }, [controlled, loading, sampleWindow, tickMs]);

  // Time spent loading is not time spent moving; start the rate fresh once it ends.
  const wasLoading = useRef(loading);
  useEffect(() => {
    if (wasLoading.current && !loading) samples.current = [{ pos, t: performance.now() }];
    wasLoading.current = loading;
  }, [loading, pos]);

  useEffect(() => {
    if (position === undefined) return;
    const last = samples.current[samples.current.length - 1];
    if (last && last.pos === position) return;
    samples.current.push({ pos: position, t: performance.now() });
    if (samples.current.length > sampleWindow) samples.current.shift();
    setSampled((n) => n + 1);
  }, [position, sampleWindow]);

  const prevPos = useRef(pos);
  useEffect(() => {
    if (prevPos.current === pos) return;
    prevPos.current = pos;
    onChangeRef.current?.(pos);
    if (pos === 0) onReadyRef.current?.();
  }, [pos]);

  const rate = () => {
    const s = samples.current;
    if (s.length < 2) return null;
    const first = s[0]!, last = s[s.length - 1]!;
    const moved = first.pos - last.pos;
    const secs = (last.t - first.t) / 1000;
    if (moved <= 0 || secs <= 0) return null;
    return moved / secs;                        // places per second
  };

  /* If consecutive gaps disagree wildly, an estimate would be a guess — so the
     component says it does not know rather than showing a number that moves. */
  const spread = () => {
    const s = samples.current;
    if (s.length < 4) return Infinity;
    const gaps: number[] = [];
    for (let i = 1; i < s.length; i++) {
      const d = s[i - 1]!.pos - s[i]!.pos;
      if (d > 0) gaps.push((s[i]!.t - s[i - 1]!.t) / d);
    }
    if (gaps.length < 2) return Infinity;
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const varr = gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length;
    return Math.sqrt(varr) / mean;              // coefficient of variation
  };

  const done = start > 0 ? Math.max(0, Math.min(1, (start - pos) / start)) : 1;
  const r = rate();
  const unstable = !r || spread() > 0.55;

  // Announce at milestones, not on every tick.
  useEffect(() => {
    if (loading) return;
    const milestone = pos === 0 ? 'next' : pos <= 5 ? '5' : pos <= 10 ? '10' : pos <= 25 ? '25' : null;
    if (milestone && milestone !== announced.current) {
      announced.current = milestone;
      setStatus(pos === 0 ? 'You are next.' : `Position ${pos} in line.`);
    }
  }, [pos, loading]);

  return (
    <div className={`grid max-w-[420px] gap-[10px] ${className}`} aria-busy={loading || undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 text-[.92rem]">
          {loading ? loadingText
            : <>You are <b className="text-[1.5rem] font-bold tabular-nums">{pos > 0 ? `#${pos}` : 'next'}</b> in line</>}
        </p>
        <p className="m-0 text-[.76rem] tabular-nums text-text-dim">
          {r && !loading ? `${(r * 60).toFixed(1)} / min` : ''}
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={loading ? undefined : Math.round(done * 100)}
        aria-label={progressLabel}
        className={`relative h-2 overflow-hidden rounded-full bg-raised${loading ? ' motion-safe:animate-pulse' : ''}`}
      >
        <span className="qp-move absolute inset-y-0 left-0 rounded-[inherit] bg-accent"
              style={{ width: `${(done * 100).toFixed(1)}%` }} />
        <span className="qp-move absolute -top-[3px] -bottom-[3px] w-0.5 bg-text"
              style={{ left: `${(done * 100).toFixed(1)}%` }} />
      </div>

      <p className={`m-0 text-[.82rem] text-text-dim ${unstable && pos > 0 && !loading ? 'italic' : ''}`}>
        {loading ? ''
          : pos <= 0 ? readyText
          : unstable ? unstableText
          : <>About <b className="font-semibold tabular-nums text-text">{human(pos / r!)}</b> left at the current rate.</>}
      </p>

      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
