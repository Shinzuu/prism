import { useCallback, useEffect, useRef, useState } from 'react';

const GROUPS = [
  { name: 'File', items: ['New', 'Open', 'Save'] },
  { name: 'Edit', items: ['Undo', 'Cut', 'Paste'] },
  { name: 'View', items: ['Zoom in', 'Full screen'] },
];
const CIRC = 2 * Math.PI * 15;

/* The entire menu, operated by ONE input. Two-level scanning turns a linear
   search into something closer to logarithmic: flat scanning over eleven items
   takes fifteen seconds to reach the last, and a miss costs a whole cycle. */
export default function SwitchScanningMenu() {
  const [level, setLevel] = useState<'group' | 'item'>('group');
  const [gi, setGi] = useState(0);
  const [ii, setIi] = useState(0);
  const [inside, setInside] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [dwell, setDwell] = useState(1400);
  const [offset, setOffset] = useState(CIRC);
  const stageRef = useRef<HTMLDivElement>(null);
  const state = useRef({ level, gi, ii, inside, dwell });
  state.current = { level, gi, ii, inside, dwell };

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(0);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    /* The countdown ring is not decoration: without it the user cannot tell
       whether they have two seconds or two hundred milliseconds, so they press
       early and select the wrong item or hesitate and miss the window. */
    const tick = () => {
      const left = Math.max(0, 1 - (performance.now() - t0) / state.current.dwell);
      setOffset(CIRC * (1 - left));
      raf.current = requestAnimationFrame(tick);
    };
    tick();
    timer.current = setTimeout(() => {
      const s = state.current;
      if (s.level === 'group') setGi((g) => (g + 1) % GROUPS.length);
      else setIi((i) => (i + 1) % GROUPS[s.inside!]!.items.length);
      schedule();
    }, state.current.dwell);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const stop = () => { if (timer.current) clearTimeout(timer.current); cancelAnimationFrame(raf.current); };
    // Never scan off-screen: a timer nobody can see is only battery.
    const io = new IntersectionObserver((es) => {
      for (const e of es) { if (e.isIntersecting) schedule(); else stop(); }
    }, { rootMargin: '60px' });
    io.observe(el);
    return () => { stop(); io.disconnect(); };
  }, [schedule]);

  const press = () => {
    if (level === 'group') { setInside(gi); setLevel('item'); setIi(0); }
    else {
      const name = GROUPS[inside!]!.items[ii]!;
      setPicked(name);
      setTimeout(() => setPicked(null), 900);
      setLevel('group'); setInside(null);
    }
    schedule();
  };

  const back = () => { if (level === 'item') { setLevel('group'); setInside(null); schedule(); } };

  const meta = picked
    ? `selected ${picked} from ${GROUPS[inside ?? gi]!.name}`
    : level === 'group' ? `scanning groups · ${GROUPS[gi]!.name}`
    : `inside ${GROUPS[inside!]!.name} · ${GROUPS[inside!]!.items[ii]}`;

  return (
    <div className="grid gap-[9px]">
      <div className="flex items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">Switch scanning</p>
        <p aria-live="polite" className="m-0 font-mono text-[.66rem] text-text-dim">{meta}</p>
      </div>

      <div
        ref={stageRef}
        tabIndex={0}
        role="application"
        aria-label="Switch scanning menu. Press Space to select, Escape to leave a group."
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(); }
          else if (e.key === 'Escape') { e.preventDefault(); back(); }
        }}
        className="relative grid gap-[5px] rounded-[9px] border border-border bg-bg p-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        {GROUPS.map((g, i) => {
          const lit = level === 'group' && i === gi;
          const isIn = inside === i;
          return (
            <div key={g.name}
              className={`ssm-group rounded-[7px] border px-2 py-1.5 ${
                lit ? 'border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]'
                : isIn ? 'border-accent' : 'border-transparent'
              }`}>
              <p className="m-0 mb-[3px] font-mono text-[.66rem] text-text-dim">{g.name}</p>
              <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
                {g.items.map((it, j) => {
                  const on = level === 'item' && isIn && j === ii;
                  return (
                    <li key={it}
                      className={`ssm-item rounded-[5px] border px-[9px] py-1 text-[.74rem] ${
                        on ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-raised'
                      } ${picked === it ? 'outline outline-2 outline-offset-1 outline-accent' : ''}`}>
                      {it}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <svg viewBox="0 0 36 36" aria-hidden className="absolute end-[7px] top-[7px] h-[22px] w-[22px]">
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                  stroke="color-mix(in oklab, var(--border) 70%, transparent)" />
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" strokeLinecap="round"
                  stroke="var(--accent)" className="ssm-arc"
                  strokeDasharray={CIRC} strokeDashoffset={offset} />
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={press}
          className="cursor-pointer rounded-[7px] border-0 bg-accent px-[13px] py-[7px] font-sans text-[.76rem] text-accent-fg focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
          Switch (or press Space)
        </button>
        <label className="flex items-center gap-1.5 text-[.7rem] text-text-dim">
          Dwell
          <input type="range" min={700} max={2600} step={100} value={dwell}
            onChange={(e) => { setDwell(Number(e.target.value)); schedule(); }}
            className="accent-accent" />
          <output className="min-w-[3.4rem] font-mono text-[.64rem]">{dwell}ms</output>
        </label>
      </div>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        One input, the whole menu. The ring is the time remaining before the scan moves on — without
        it the user is guessing how long they have.
      </p>
    </div>
  );
}
