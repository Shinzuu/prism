import { useEffect, useRef, useState } from 'react';

type State = 'waiting' | 'running' | 'done' | 'failed' | 'skipped';
type Stage = { name: string; ms: number; fails: boolean; state: State; time: string };

const INITIAL: Stage[] = [
  { name: 'Checkout', ms: 600, fails: false, state: 'waiting', time: '' },
  { name: 'Install', ms: 1500, fails: false, state: 'waiting', time: '' },
  { name: 'Test', ms: 2200, fails: true, state: 'waiting', time: '' },
  { name: 'Build', ms: 1100, fails: false, state: 'waiting', time: '' },
  { name: 'Deploy', ms: 900, fails: false, state: 'waiting', time: '' },
];

export default function StagedPipeline() {
  const [stages, setStages] = useState<Stage[]>(INITIAL);
  const [status, setStatus] = useState('');
  const [failedAt, setFailedAt] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runToken = useRef(0);

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
        return;
      }
      current = current.map((s, j) => (j === i ? { ...s, state: 'done', time: took } : s));
      setStages(current);
    }
    setStatus('Pipeline finished.');
  };

  useEffect(() => {
    void run(0, INITIAL);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = (from: number) => {
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
        aria-label="Deploy pipeline"
        className="m-0 grid max-w-[440px] list-none gap-px overflow-hidden rounded-[10px] border border-border bg-border p-0"
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
                3 assertions failed in suite “filmstrip”.
                <button
                  type="button"
                  onClick={() => retry(i)}
                  className="ml-2 cursor-pointer border-0 bg-transparent p-0 font-mono text-[.7rem] text-accent underline underline-offset-[3px]"
                >
                  retry from here
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
