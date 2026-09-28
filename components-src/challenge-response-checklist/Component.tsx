import { useEffect, useState } from 'react';

type Item = { q: string; a: string; needsGround?: boolean; hold?: string };

const ITEMS: Item[] = [
  { q: 'Parking brake', a: 'SET' },
  { q: 'Fuel quantity', a: '12.4 t, cross-checked' },
  { q: 'Cabin doors', a: 'CLOSED and ARMED' },
  { q: 'Ground crew clear', a: 'CONFIRMED', needsGround: true,
    hold: 'Ground crew has not reported clear. This item holds.' },
  { q: 'Beacon', a: 'ON' },
  { q: 'Pushback clearance', a: 'RECEIVED' },
];

export default function ChallengeResponseChecklist() {
  const [at, setAt] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [groundClear, setGroundClear] = useState(false);
  const [committed, setCommitted] = useState(false);

  // The precondition resolves on its own, as a real one would.
  useEffect(() => {
    const t = setTimeout(() => setGroundClear(true), 4200);
    return () => clearTimeout(t);
  }, []);

  const reset = () => { setAt(0); setDone(new Set()); setGroundClear(false); setCommitted(false);
    setTimeout(() => setGroundClear(true), 4200); };

  const holding = at < ITEMS.length && Boolean(ITEMS[at]!.needsGround) && !groundClear;
  const allDone = done.size === ITEMS.length;

  return (
    <div className="grid gap-[9px]">
      <div className="flex items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">Before pushback</p>
        <p aria-live="polite" className="m-0 font-mono text-[.66rem] tabular-nums text-text-dim">
          {committed ? `committed · ${ITEMS.length} items verified individually`
            : `${done.size}/${ITEMS.length}${holding ? ' · HOLDING' : allDone ? ' · complete' : ''}`}
        </p>
      </div>

      <ol className="m-0 grid list-none gap-0.5 p-0 [counter-reset:c]">
        {ITEMS.map((item, i) => {
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
                disabled={!reachable || held || isDone}
                onClick={() => { setDone((d) => new Set(d).add(i)); setAt(i + 1); }}
                className="cursor-pointer whitespace-nowrap rounded-md border border-border bg-raised px-[10px] py-[5px] font-sans text-[.68rem] text-text disabled:cursor-default disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {isDone ? 'confirmed' : held ? 'holding' : 'Confirm'}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!allDone || committed}
          onClick={() => setCommitted(true)}
          className="cursor-pointer rounded-lg border-0 bg-accent px-[13px] py-[7px] font-sans text-[.76rem] text-accent-fg disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Commit
        </button>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-lg border border-border bg-transparent px-[13px] py-[7px] font-sans text-[.76rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Reset
        </button>
      </div>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        Each line states a condition and is confirmed on its own. One item deliberately holds — it
        cannot be confirmed until its precondition is true, and no amount of clicking will skip it.
      </p>
    </div>
  );
}
