import { useEffect, useState } from 'react';

/** q is the challenge, a the response; needsGround items hold until the precondition is met. */
export type Item = { q: string; a: string; needsGround?: boolean; hold?: string };

export type ChecklistLabels = {
  confirm: string; confirmed: string; holding: string; commit: string; reset: string;
};

const DEFAULT_ITEMS: Item[] = [
  { q: 'Parking brake', a: 'SET' },
  { q: 'Fuel quantity', a: '12.4 t, cross-checked' },
  { q: 'Cabin doors', a: 'CLOSED and ARMED' },
  { q: 'Ground crew clear', a: 'CONFIRMED', needsGround: true,
    hold: 'Ground crew has not reported clear. This item holds.' },
  { q: 'Beacon', a: 'ON' },
  { q: 'Pushback clearance', a: 'RECEIVED' },
];

const DEFAULT_LABELS: ChecklistLabels = {
  confirm: 'Confirm', confirmed: 'confirmed', holding: 'holding', commit: 'Commit', reset: 'Reset',
};

const DEFAULT_NOTE =
  'Each line states a condition and is confirmed on its own. One item deliberately holds — it '
  + 'cannot be confirmed until its precondition is true, and no amount of clicking will skip it.';

export interface ChallengeResponseChecklistProps {
  /** Checklist lines, read and confirmed in order. */
  items?: Item[];
  /** Heading above the list. */
  title?: string;
  /** Button and state wording; any key left out keeps its default. */
  labels?: Partial<ChecklistLabels>;
  /** Explanatory note under the buttons; pass an empty string to hide it. */
  note?: string;
  /** Demo only: ms until the precondition resolves by itself. Ignored when `preconditionMet` is set. */
  holdMs?: number;
  /** Controls the precondition from outside (e.g. a live ground-crew signal). */
  preconditionMet?: boolean;
  /** Disables every button. */
  disabled?: boolean;
  /** Fired when one item is confirmed. */
  onConfirm?: (index: number, item: Item) => void;
  /** Fired when the completed checklist is committed. */
  onCommit?: () => void;
  /** Fired when the checklist is reset. */
  onReset?: () => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function ChallengeResponseChecklist({
  items = DEFAULT_ITEMS,
  title = 'Before pushback',
  labels,
  note = DEFAULT_NOTE,
  holdMs = 4200,
  preconditionMet,
  disabled = false,
  onConfirm,
  onCommit,
  onReset,
  className = '',
}: ChallengeResponseChecklistProps) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const [at, setAt] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [timerClear, setTimerClear] = useState(false);
  const [committed, setCommitted] = useState(false);
  const groundClear = preconditionMet ?? timerClear;

  // The precondition resolves on its own, as a real one would.
  useEffect(() => {
    if (preconditionMet !== undefined) return;
    const t = setTimeout(() => setTimerClear(true), holdMs);
    return () => clearTimeout(t);
  }, [holdMs, preconditionMet]);

  const reset = () => { setAt(0); setDone(new Set()); setTimerClear(false); setCommitted(false);
    if (preconditionMet === undefined) setTimeout(() => setTimerClear(true), holdMs);
    onReset?.(); };

  const holding = at < items.length && Boolean(items[at]!.needsGround) && !groundClear;
  const allDone = done.size === items.length;

  return (
    <div className={`grid gap-[9px] ${className}`}>
      <div className="flex items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">{title}</p>
        <p aria-live="polite" className="m-0 font-mono text-[.66rem] tabular-nums text-text-dim">
          {committed ? `committed · ${items.length} items verified individually`
            : `${done.size}/${items.length}${holding ? ' · HOLDING' : allDone ? ' · complete' : ''}`}
        </p>
      </div>

      <ol className="m-0 grid list-none gap-0.5 p-0 [counter-reset:c]">
        {items.map((item, i) => {
          const isDone = done.has(i);
          const reachable = i === at;
          const held = reachable && Boolean(item.needsGround) && !groundClear;
          /* Items ahead stay visible and inert — hiding what is coming stops
             anyone challenging the sequence, which is the point of reading a
             checklist aloud. */
          const ahead = i > at;

          return (
            <li
              key={item.q}
              className={`grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 rounded-lg border px-[10px] py-2 text-[.76rem] [counter-increment:c] before:font-mono before:text-[.62rem] before:text-text-dim before:content-[counter(c)] ${
                held ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_7%,var(--bg))]'
                : isDone ? 'border-[color-mix(in_oklab,var(--accent)_40%,var(--border))] bg-bg'
                : 'border-border bg-bg'
              } ${ahead ? 'opacity-50' : ''}`}
            >
              <div className="grid min-w-0 gap-0.5">
                <span>{item.q}</span>
                <span className={`font-mono text-[.62rem] ${isDone || held ? 'text-accent' : 'text-text-dim'}`}>
                  {isDone ? `✓ ${item.a}` : held ? item.hold : item.a}
                </span>
              </div>
              <button
                type="button"
                // Only the current item is operable, and never in bulk.
                disabled={disabled || !reachable || held || isDone}
                onClick={() => { setDone((d) => new Set(d).add(i)); setAt(i + 1); onConfirm?.(i, item); }}
                className={`cursor-pointer whitespace-nowrap rounded-md border border-border bg-raised px-[10px] py-[5px] font-sans text-[.68rem] text-text hover:border-accent active:translate-y-px disabled:opacity-50 disabled:hover:border-border disabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${disabled ? 'disabled:cursor-not-allowed' : 'disabled:cursor-default'}`}
              >
                {isDone ? L.confirmed : held ? L.holding : L.confirm}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || !allDone || committed}
          onClick={() => { setCommitted(true); onCommit?.(); }}
          className={`cursor-pointer rounded-lg border-0 bg-accent px-[13px] py-[7px] font-sans text-[.76rem] text-accent-fg hover:brightness-[1.08] active:translate-y-px disabled:opacity-45 disabled:hover:brightness-100 disabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${disabled ? 'disabled:cursor-not-allowed' : 'disabled:cursor-default'}`}
        >
          {L.commit}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={disabled}
          className="cursor-pointer rounded-lg border border-border bg-transparent px-[13px] py-[7px] font-sans text-[.76rem] text-text hover:border-accent active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          {L.reset}
        </button>
      </div>

      {note && <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">{note}</p>}
    </div>
  );
}
