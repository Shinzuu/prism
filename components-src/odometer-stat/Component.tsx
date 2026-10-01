import { useEffect, useRef, useState } from 'react';

export type Figure = { label: string; value: number; delta: string; suffix?: string };

const DEFAULT_FIGURES: Figure[] = [
  { label: 'Requests served', value: 1284697, delta: '+12,408 since yesterday' },
  { label: 'Median latency', value: 34, delta: '−6ms since yesterday', suffix: 'ms' },
];

/* Split a figure into cells. Thousands separators are their own inert cell,
   never a wheel — a comma that rolls through the digits is nonsense. */
function cells(value: number, suffix?: string) {
  const digits = String(value).split('');
  const out: ({ kind: 'sep' } | { kind: 'digit'; d: number; key: string })[] = [];
  digits.forEach((d, i) => {
    const fromEnd = digits.length - i;
    if (!suffix && fromEnd % 3 === 0 && i > 0) out.push({ kind: 'sep' });
    out.push({ kind: 'digit', d: Number(d), key: `${i}` });
  });
  return out;
}

function Odometer({ fig }: { fig: Figure }) {
  const list = cells(fig.value, fig.suffix);
  const pretty = fig.suffix ? `${fig.value}${fig.suffix}` : fig.value.toLocaleString();

  return (
    <div>
      <p className="m-0 mb-[6px] text-[.8rem] text-text-dim">{fig.label}</p>
      <p className="od-figure m-0 flex items-baseline text-[2.6rem] font-bold tabular-nums">
        {/* One announcement of the final figure, not ten of the digits moving. */}
        <span className="sr-only">{pretty}</span>
        {list.map((c, i) =>
          c.kind === 'sep' ? (
            <span key={`s${i}`} className="inline-block w-[.42ch] text-center">,</span>
          ) : (
            <span key={`d${i}`} className="od-digit inline-block overflow-hidden">
              <span
                className="od-strip block"
                style={{ translate: `0 calc(var(--cell) * ${-c.d})` }}
              >
                {[0,1,2,3,4,5,6,7,8,9].map((n) => <span key={n} className="od-cell block text-center">{n}</span>)}
              </span>
            </span>
          )
        )}
        {fig.suffix && (
          <span className="ml-[.14em] text-[.44em] font-medium text-text-dim">{fig.suffix}</span>
        )}
      </p>
      <p className="m-0 mt-2 text-[.78rem] tabular-nums text-text-dim">{fig.delta}</p>
    </div>
  );
}

/* Demo data source: drifts each figure by a plausible amount. */
const randomStep = (prev: Figure[]): Figure[] =>
  prev.map((f) =>
    f.suffix
      ? { ...f, value: Math.max(8, Math.round(f.value + (Math.random() * 30 - 14))) }
      : { ...f, value: f.value + Math.round(Math.random() * 40000 + 2000) }
  );

export interface OdometerStatProps {
  /** Figures to show; passing a new array rolls the wheels to the new values. */
  figures?: Figure[];
  /** Produces the next figures when the roll button is pressed. */
  getNext?: (prev: Figure[]) => Figure[];
  /** Text of the roll button. */
  rollLabel?: string;
  /** Hides the roll button, for a display driven purely by `figures`. */
  showRollButton?: boolean;
  /** Disables the roll button. */
  disabled?: boolean;
  /** Fires with the figures produced by a roll. */
  onRoll?: (next: Figure[]) => void;
  /** Extra classes for the root element. */
  className?: string;
}

export default function OdometerStat({
  figures = DEFAULT_FIGURES,
  getNext = randomStep,
  rollLabel = 'Roll to new figures',
  showRollButton = true,
  disabled = false,
  onRoll,
  className = '',
}: OdometerStatProps) {
  const [figs, setFigs] = useState(figures);
  const reduced = useRef(false);
  useEffect(() => { reduced.current = matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);
  // A parent feeding live data drives the wheels by passing new figures.
  useEffect(() => { setFigs(figures); }, [figures]);

  /* Only the wheels whose digit actually changed move, because React keys the
     cells by position and only the translate changes — 1,284,697 to 1,284,712
     turns three wheels, not seven. */
  const roll = () => {
    if (disabled) return;
    const next = getNext(figs);
    setFigs(next);
    onRoll?.(next);
  };

  return (
    <div className={`grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] items-start gap-[22px] ${className}`}>
      {figs.map((f) => <Odometer key={f.label} fig={f} />)}
      {showRollButton && (
        <button
          type="button"
          onClick={roll}
          disabled={disabled}
          className="col-span-full cursor-pointer justify-self-start rounded-full border border-border bg-transparent px-[15px] py-2 font-sans text-[.82rem] text-text hover:border-accent hover:text-accent active:scale-[.97] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-text disabled:active:scale-100"
        >
          {rollLabel}
        </button>
      )}
    </div>
  );
}
