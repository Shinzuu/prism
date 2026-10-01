import { useEffect, useRef, useState } from 'react';

export type StageState = 'waiting' | 'running' | 'done' | 'failed' | 'skipped';
type State = StageState;
/** A stage to run: how long it takes, and whether its first run fails. */
export type PipelineStage = { name: string; ms: number; fails?: boolean };
type Stage = { name: string; ms: number; fails: boolean; state: State; time: string };

const DEFAULT_STAGES: PipelineStage[] = [
  { name: 'Checkout', ms: 600, fails: false },
  { name: 'Install', ms: 1500, fails: false },
  { name: 'Test', ms: 2200, fails: true },
  { name: 'Build', ms: 1100, fails: false },
  { name: 'Deploy', ms: 900, fails: false },
];

const toStages = (list: PipelineStage[]): Stage[] =>
  list.map((s) => ({ name: s.name, ms: s.ms, fails: s.fails ?? false, state: 'waiting' as State, time: '' }));

export interface StagedPipelineProps {
  /** Stages in run order; the run starts on mount. */
  stages?: PipelineStage[];
  /** Accessible name of the stage list. */
  ariaLabel?: string;
  /** Detail shown under a failed stage. */
  failureMessage?: string;
  /** Label of the retry button on a failed stage. */
  retryLabel?: string;
  /** Status announced when every stage has passed. */
  finishedText?: string;
  /** Disables the retry button. */
  disabled?: boolean;
  /** Fired whenever a stage changes state. */
  onStageChange?: (name: string, state: StageState) => void;
  /** Fired when the last stage passes. */
  onComplete?: () => void;
  /** Extra classes appended to the stage list. */
  className?: string;
}

export default function StagedPipeline({
  stages: stageConfig = DEFAULT_STAGES,
  ariaLabel = 'Deploy pipeline',
  failureMessage = '3 assertions failed in suite “filmstrip”.',
  retryLabel = 'retry from here',
  finishedText = 'Pipeline finished.',
  disabled = false,
  onStageChange,
  onComplete,
  className = '',
}: StagedPipelineProps) {
  const [stages, setStages] = useState<Stage[]>(() => toStages(stageConfig));
  const [status, setStatus] = useState('');
  const [failedAt, setFailedAt] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runToken = useRef(0);
  // A run outlives the render that started it, so it reads the latest props through a ref.
  const latest = useRef({ onStageChange, onComplete, finishedText });
  latest.current = { onStageChange, onComplete, finishedText };

  const clearTimers = () => { for (const t of timers.current) clearTimeout(t); timers.current = []; };
  const sleep = (ms: number) =>
    new Promise<void>((r) => { timers.current.push(setTimeout(r, ms)); });

  const run = async (from: number, list: Stage[]) => {
    const token = ++runToken.current;
    let current = list;
    for (let i = from; i < current.length; i++) {
      if (runToken.current !== token) return;
      current = current.map((s, j) => (j === i ? { ...s, state: 'running', time: '' } : s));
      setStages(current);
      latest.current.onStageChange?.(current[i]!.name, 'running');

      const t0 = performance.now();
      await sleep(current[i]!.ms);
      if (runToken.current !== token) return;
      const took = `${((performance.now() - t0) / 1000).toFixed(1)}s`;

      if (current[i]!.fails) {
        /* Everything after a failure is SKIPPED, not pending. A stage that will
           never run must not look like one that is about to. */
        current = current.map((s, j) =>
          j === i ? { ...s, state: 'failed', time: took }
          : j > i ? { ...s, state: 'skipped', time: 'skipped' }
          : s);
        setStages(current);
        setFailedAt(i);
        setStatus(`${current[i]!.name} failed after ${took}. Later stages skipped.`);
        latest.current.onStageChange?.(current[i]!.name, 'failed');
        return;
      }
      current = current.map((s, j) => (j === i ? { ...s, state: 'done', time: took } : s));
      setStages(current);
      latest.current.onStageChange?.(current[i]!.name, 'done');
    }
    setStatus(latest.current.finishedText);
    latest.current.onComplete?.();
  };

  useEffect(() => {
    void run(0, stages);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = (from: number) => {
    if (disabled) return;
    setFailedAt(null);
    // The second run succeeds, so the demo reaches the end.
    const reset = stages.map((s, j) =>
      j >= from ? { ...s, state: 'waiting' as State, time: '', fails: false } : s);
    setStages(reset);
    void run(from, reset);
  };

  const mark = (s: State) =>
    s === 'running' ? 'sp-mark border-accent border-r-transparent sp-spin'
    : s === 'done' ? 'sp-mark border-accent bg-accent'
    : s === 'failed' ? 'sp-mark border-accent bg-accent !rounded-[3px]'
    : 'sp-mark border-border';

  return (
    <>
      <ol
        aria-label={ariaLabel}
        aria-busy={stages.some((s) => s.state === 'running') || undefined}
        className={`m-0 grid max-w-[440px] list-none gap-px overflow-hidden rounded-[10px] border border-border bg-border p-0 ${className}`}
      >
        {stages.map((s, i) => (
          <li
            key={s.name}
            className={`grid grid-cols-[18px_1fr_auto] items-center gap-[11px] px-[14px] py-[11px] text-[.86rem] ${
              s.state === 'failed' ? 'bg-[color-mix(in_oklab,var(--accent)_7%,var(--bg))]' : 'bg-bg'
            } ${s.state === 'skipped' ? 'opacity-45' : ''}`}
          >
            <span className={`justify-self-center ${mark(s.state)}`} />
            <span>{s.name}</span>
            <span className="font-mono text-[.72rem] tabular-nums text-text-dim">{s.time}</span>

            {failedAt === i && (
              <p className="col-start-2 col-end-[-1] m-0 mt-[5px] text-[.76rem] text-accent">
                {failureMessage}
                <button
                  type="button"
                  onClick={() => retry(i)}
                  disabled={disabled}
                  className="ml-2 cursor-pointer border-0 bg-transparent p-0 font-mono text-[.7rem] text-accent underline underline-offset-[3px] hover:no-underline active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:underline disabled:active:translate-y-0"
                >
                  {retryLabel}
                </button>
              </p>
            )}
          </li>
        ))}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </>
  );
}
