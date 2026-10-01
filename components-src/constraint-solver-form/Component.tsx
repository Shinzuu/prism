import { useState } from 'react';

const DOF = 2;   // width and height determine ratio and area
export type Key = 'w' | 'h' | 'r' | 'a';
export type SolverField = { key: Key; label: string; unit: string };
const DEFAULT_FIELDS: SolverField[] = [
  { key: 'w', label: 'Width', unit: 'mm' },
  { key: 'h', label: 'Height', unit: 'mm' },
  { key: 'r', label: 'Ratio', unit: 'w:h' },
  { key: 'a', label: 'Area', unit: 'm²' },
];
const DEFAULT_VALUES: Record<Key, string> = { w: '1200', h: '800', r: '1.5', a: '0.96' };
const DEFAULT_DRIVING: Key[] = ['w', 'h'];
const DEFAULT_INTRO = 'Pin the values you know. The rest are solved for. Pin too many and it names the one to release.';

function solve(vals: Record<Key, string>, order: Key[]): Record<Key, string> {
  const driving = new Set(order);
  /* Six possible pairs, each handled explicitly rather than by a generic
     solver, so the awkward ones (area with ratio needs a square root) are
     visible in the code instead of silently wrong. */
  const solved: Record<Key, string> = { ...vals };
  if (driving.size === DOF) {
    const n = (k: Key) => parseFloat(vals[k]);
    const set = (k: Key, v: number) => { if (!driving.has(k)) solved[k] = Number.isFinite(v) ? String(Number(v.toFixed(4))) : ''; };
    const key = [...order].sort().join('');
    const w = n('w'), h = n('h'), r = n('r'), a = n('a');
    if (key === 'hw') { set('r', w / h); set('a', (w * h) / 1e6); }
    else if (key === 'rw') { const H = w / r; set('h', H); set('a', (w * H) / 1e6); }
    else if (key === 'hr') { const W = h * r; set('w', W); set('a', (W * h) / 1e6); }
    else if (key === 'aw') { const H = (a * 1e6) / w; set('h', H); set('r', w / H); }
    else if (key === 'ah') { const W = (a * 1e6) / h; set('w', W); set('r', W / h); }
    else if (key === 'ar') { const W = Math.sqrt(a * 1e6 * r); set('w', W); set('h', W / r); }
  }
  return solved;
}

export interface ConstraintSolverFormProps {
  /** Label and unit for each of the four quantities, in display order. */
  fields?: SolverField[];
  /** Starting value of every field, as typed text. */
  initialValues?: Record<Key, string>;
  /** Fields pinned as driving on first render, oldest first. */
  initialDriving?: Key[];
  /** Instruction line above the fields. */
  intro?: string;
  /** Called with the solved values and the driving fields whenever either changes. */
  onChange?: (values: Record<Key, string>, driving: Key[]) => void;
  /** Disables every input and pin toggle. */
  disabled?: boolean;
  /** Extra classes for the root form. */
  className?: string;
}

export default function ConstraintSolverForm({
  fields = DEFAULT_FIELDS,
  initialValues = DEFAULT_VALUES,
  initialDriving = DEFAULT_DRIVING,
  intro = DEFAULT_INTRO,
  onChange,
  disabled = false,
  className = '',
}: ConstraintSolverFormProps) {
  const [vals, setVals] = useState<Record<Key, string>>(initialValues);
  const [order, setOrder] = useState<Key[]>(initialDriving);
  const driving = new Set(order);
  const solved = solve(vals, order);
  const labelOf = (k: Key) => (fields.find((f) => f.key === k)?.label ?? k).toLowerCase();

  const over = driving.size - DOF;
  /* Over-constrained names the OLDEST pin to release — the newest is what the
     person just asked for. And it never says "invalid": every value is fine,
     only the combination is impossible. */
  const release = over > 0 ? order[0] : null;
  const conflicts = new Set(over > 0 ? order.slice(0, over) : []);

  const toggle = (k: Key) => {
    const next = order.includes(k) ? order.filter((x) => x !== k) : [...order, k];
    setOrder(next);
    onChange?.(solve(vals, next), next);
  };

  const edit = (k: Key, value: string) => {
    const next = { ...vals, [k]: value };
    setVals(next);
    onChange?.(solve(next, order), order);
  };

  const status =
    over > 0 && release ? `Over-constrained by ${over}. Release ${labelOf(release)} to solve for the rest.`
    : driving.size < DOF ? `Under-constrained. Pin ${DOF - driving.size} more to solve.`
    : `Solved from ${order.map(labelOf).join(' and ')}.`;

  return (
    <form className={`grid gap-[10px] ${className}`} onSubmit={(e) => e.preventDefault()} noValidate>
      <p className="m-0 text-[.74rem] leading-relaxed text-text-dim">
        {intro}
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {fields.map((f) => {
          const on = driving.has(f.key);
          return (
            <div
              key={f.key}
              className={`grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-[5px] rounded-[9px] border bg-bg px-[9px] py-2 ${
                conflicts.has(f.key) ? 'border-accent' : 'border-border'
              }`}
            >
              <label className="col-span-2 text-[.7rem] text-text-dim" htmlFor={`csf-${f.key}`}>
                {f.label} <span className="font-mono text-[.62rem] opacity-75">{f.unit}</span>
              </label>
              <input
                id={`csf-${f.key}`}
                type="number" inputMode="decimal" step="any"
                value={solved[f.key]}
                // readOnly, NEVER disabled: disabled drops it from the tab order
                // and the a11y tree and greys the value the form just computed.
                readOnly={!on}
                disabled={disabled}
                onChange={(e) => edit(f.key, e.target.value)}
                className={`w-full min-w-0 rounded-md border px-[7px] py-[5px] font-sans text-[.84rem] tabular-nums focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                  on ? 'border-border bg-raised text-text' : 'border-dashed border-border bg-transparent text-text-dim'
                }`}
              />
              <button
                type="button"
                aria-pressed={on}
                disabled={disabled}
                onClick={() => toggle(f.key)}
                className={`cursor-pointer whitespace-nowrap rounded-full border px-2 py-1 font-mono text-[.6rem] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 enabled:hover:border-accent enabled:active:scale-[.96] disabled:cursor-not-allowed disabled:opacity-50 ${
                  on ? 'border-accent text-accent' : 'border-border text-text-dim'
                } ${conflicts.has(f.key) ? 'bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]' : 'bg-raised'}`}
              >
                {on ? 'driving' : 'derived'}
              </button>
            </div>
          );
        })}
      </div>

      <p role="status" className={`m-0 min-h-[2.4em] text-[.74rem] leading-relaxed ${over > 0 ? 'text-accent' : 'text-text-dim'}`}>
        {status}
      </p>
    </form>
  );
}
