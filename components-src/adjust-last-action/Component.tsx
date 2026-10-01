import { useState } from 'react';

type State = { radius: number; spread: number };
export type Params = { radius: number; spread: number };

const DEFAULT_PARAMS: Params = { radius: 6, spread: 12 };
const DEFAULT_RANGES: Record<keyof Params, readonly [number, number]> = { radius: [0, 20], spread: [0, 40] };

/* Pure: base state in, new state out, reading nothing from the DOM. That
   purity is what makes re-running safe. */
const applyBlur = (base: State, p: Params): State => ({
  radius: base.radius + p.radius,
  spread: base.spread + p.spread,
});

export interface AdjustLastActionProps {
  /** Parameters the action runs with the first time it is applied. */
  initialParams?: Params;
  /** Slider [min, max] for each parameter. */
  ranges?: Record<keyof Params, readonly [number, number]>;
  /** Label on the button that runs the action. */
  actionLabel?: string;
  /** Short name of the action, shown in the panel heading and status line. */
  actionName?: string;
  /** Heading of the adjust panel. */
  panelTitle?: string;
  /** Status text once the action is committed. */
  committedText?: string;
  /** Disables the action button and the sliders. */
  disabled?: boolean;
  /** Fired after the action is applied, with the parameters used. */
  onApply?: (params: Params) => void;
  /** Fired each time a parameter is adjusted and the action re-runs. */
  onAdjust?: (params: Params) => void;
  /** Fired when clicking the canvas commits the action. */
  onCommit?: (params: Params) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function AdjustLastAction({
  initialParams = DEFAULT_PARAMS,
  ranges = DEFAULT_RANGES,
  actionLabel = 'Apply blur',
  actionName = 'blur',
  panelTitle = 'Adjust last action',
  committedText = 'committed — no longer adjustable',
  disabled = false,
  onApply,
  onAdjust,
  onCommit,
  className = '',
}: AdjustLastActionProps) {
  const [shape, setShape] = useState<State>({ radius: 0, spread: 0 });
  // The snapshot the action re-runs FROM. Taken once, never updated by a re-run.
  const [before, setBefore] = useState<State | null>(null);
  const [params, setParams] = useState<Params>(initialParams);
  const [runs, setRuns] = useState(0);
  const [committed, setCommitted] = useState(false);

  const run = (base: State, p: Params, rerun: boolean) => {
    setShape(applyBlur(base, p));
    setRuns((n) => n + 1);
    void rerun;
  };

  const apply = () => {
    if (disabled) return;
    const snap = shape;          // snapshot taken BEFORE the first apply
    setBefore(snap);
    setRuns(0);
    setCommitted(false);
    run(snap, params, false);
    onApply?.(params);
  };

  const change = (k: keyof Params, v: number) => {
    if (disabled) return;
    const next = { ...params, [k]: v };
    setParams(next);
    /* Re-run from the snapshot, never from the current state. Applying to the
       output compounds: three nudges of a radius from 6 to 8 would give 21. */
    if (before) { run(before, next, true); onAdjust?.(next); }
  };

  return (
    <div className={`grid gap-[9px] ${className}`}>
      <div
        onClick={() => { if (before && !disabled) { setBefore(null); setCommitted(true); onCommit?.(params); } }}
        className="grid h-[108px] place-items-center rounded-[9px] border border-border bg-bg"
      >
        <div
          className="ala-shape h-14 w-[74px] rounded-[10px] bg-accent"
          style={{ '--ala-r': `${shape.radius}px`, '--ala-s': `${shape.spread}px` } as React.CSSProperties}
        />
      </div>

      <div className="flex flex-wrap items-center gap-[10px]">
        <button
          type="button" onClick={apply} disabled={disabled}
          className="cursor-pointer rounded-[7px] border-0 bg-accent px-[13px] py-[7px] font-sans text-[.78rem] text-accent-fg hover:brightness-[1.08] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >{actionLabel}</button>
        <span className="font-mono text-[.66rem] text-text-dim">
          {committed ? committedText : before ? `${actionName} r${params.radius} s${params.spread}` : ''}
        </span>
      </div>

      {/* Appears only AFTER the action, and never blocks the canvas: parameters
          are meaningless until you can see what they did. */}
      {before && (
        <div className="grid gap-[7px] rounded-[9px] border border-border bg-raised px-3 py-[10px]">
          <p className="m-0 text-[.76rem] font-medium">
            {panelTitle} <span className="font-normal text-text-dim">— {actionName}</span>
          </p>
          {(['radius', 'spread'] as const).map((k) => {
            const [min, max] = ranges[k];
            return (
              <label key={k} className="grid grid-cols-[4.2rem_1fr_2.4rem] items-center gap-2 text-[.72rem] text-text-dim">
                <span className="capitalize">{k}</span>
                <input
                  type="range" min={min} max={max} step={1} value={params[k]}
                  onChange={(e) => change(k, Number(e.target.value))}
                  disabled={disabled}
                  className="min-w-0 accent-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <output className="text-right font-mono text-[.66rem] tabular-nums text-text">{params[k]}</output>
              </label>
            );
          })}
          <p className="m-0 font-mono text-[.62rem] text-text-dim">
            applied from the pre-action snapshot · run {runs}{runs > 1 ? ' (re-run, not stacked)' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
