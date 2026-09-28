import { useState } from 'react';

type State = { radius: number; spread: number };
type Params = { radius: number; spread: number };

/* Pure: base state in, new state out, reading nothing from the DOM. That
   purity is what makes re-running safe. */
const applyBlur = (base: State, p: Params): State => ({
  radius: base.radius + p.radius,
  spread: base.spread + p.spread,
});

export default function AdjustLastAction() {
  const [shape, setShape] = useState<State>({ radius: 0, spread: 0 });
  // The snapshot the action re-runs FROM. Taken once, never updated by a re-run.
  const [before, setBefore] = useState<State | null>(null);
  const [params, setParams] = useState<Params>({ radius: 6, spread: 12 });
  const [runs, setRuns] = useState(0);
  const [committed, setCommitted] = useState(false);

  const run = (base: State, p: Params, rerun: boolean) => {
    setShape(applyBlur(base, p));
    setRuns((n) => n + 1);
    void rerun;
  };

  const apply = () => {
    const snap = shape;          // snapshot taken BEFORE the first apply
    setBefore(snap);
    setRuns(0);
    setCommitted(false);
    run(snap, params, false);
  };

  const change = (k: keyof Params, v: number) => {
    const next = { ...params, [k]: v };
    setParams(next);
    /* Re-run from the snapshot, never from the current state. Applying to the
       output compounds: three nudges of a radius from 6 to 8 would give 21. */
    if (before) run(before, next, true);
  };

  return (
    <div className="grid gap-[9px]">
      <div
        onClick={() => { if (before) { setBefore(null); setCommitted(true); } }}
        className="grid h-[108px] place-items-center rounded-[9px] border border-border bg-bg"
      >
        <div
          className="ala-shape h-14 w-[74px] rounded-[10px] bg-accent"
          style={{ '--ala-r': `${shape.radius}px`, '--ala-s': `${shape.spread}px` } as React.CSSProperties}
        />
      </div>

      <div className="flex flex-wrap items-center gap-[10px]">
        <button
          type="button" onClick={apply}
          className="cursor-pointer rounded-[7px] border-0 bg-accent px-[13px] py-[7px] font-sans text-[.78rem] text-accent-fg focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >Apply blur</button>
        <span className="font-mono text-[.66rem] text-text-dim">
          {committed ? 'committed — no longer adjustable' : before ? `blur r${params.radius} s${params.spread}` : ''}
        </span>
      </div>

      {/* Appears only AFTER the action, and never blocks the canvas: parameters
          are meaningless until you can see what they did. */}
      {before && (
        <div className="grid gap-[7px] rounded-[9px] border border-border bg-raised px-3 py-[10px]">
          <p className="m-0 text-[.76rem] font-medium">
            Adjust last action <span className="font-normal text-text-dim">— blur</span>
          </p>
          {([['radius', 0, 20], ['spread', 0, 40]] as const).map(([k, min, max]) => (
            <label key={k} className="grid grid-cols-[4.2rem_1fr_2.4rem] items-center gap-2 text-[.72rem] text-text-dim">
              <span className="capitalize">{k}</span>
              <input
                type="range" min={min} max={max} step={1} value={params[k]}
                onChange={(e) => change(k, Number(e.target.value))}
                className="min-w-0 accent-accent"
              />
              <output className="text-right font-mono text-[.66rem] tabular-nums text-text">{params[k]}</output>
            </label>
          ))}
          <p className="m-0 font-mono text-[.62rem] text-text-dim">
            applied from the pre-action snapshot · run {runs}{runs > 1 ? ' (re-run, not stacked)' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
