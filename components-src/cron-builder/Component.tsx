import { useMemo, useState } from 'react';

const RANGES = { min: [0, 59], hour: [0, 23], dom: [1, 31], mon: [1, 12], dow: [0, 6] } as const;
type Key = keyof typeof RANGES;
const ORDER: Key[] = ['min', 'hour', 'dom', 'mon', 'dow'];
const LABELS: Record<Key, string> = { min: 'Minute', hour: 'Hour', dom: 'Day', mon: 'Month', dow: 'Weekday' };
const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function expand(field: string, [lo, hi]: readonly [number, number]): number[] | null {
  const out = new Set<number>();
  for (const part of field.split(',')) {
    const m = /^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part.trim());
    if (!m) return null;
    const step = m[3] ? +m[3] : 1;
    if (step < 1) return null;
    let a: number, b: number;
    if (m[1] === '*') { a = lo; b = hi; }
    else { a = +m[1]!; b = m[2] !== undefined ? +m[2] : (m[3] ? hi : a); }
    if (a < lo || b > hi || a > b) return null;
    for (let v = a; v <= b; v += step) out.add(v);
  }
  return out.size ? [...out].sort((x, y) => x - y) : null;
}

/* Nobody writes cron correctly first time, so the component's job is to answer
   the only question that matters: when will this actually fire? */
function nextRuns(sets: Record<Key, number[]>, from: Date, n: number) {
  const out: Date[] = [];
  const d = new Date(from);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  // Hard ceiling: a cron that cannot fire within four years does not fire, and
  // must be reported rather than allowed to hang the page.
  const limit = 60 * 24 * 366 * 4;
  for (let i = 0; i < limit && out.length < n; i++) {
    if (sets.mon.includes(d.getMonth() + 1) && sets.dom.includes(d.getDate()) &&
        sets.dow.includes(d.getDay()) && sets.hour.includes(d.getHours()) &&
        sets.min.includes(d.getMinutes())) out.push(new Date(d));
    d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}

export default function CronBuilder() {
  const [raw, setRaw] = useState<Record<Key, string>>({ min: '*/15', hour: '9-17', dom: '*', mon: '*', dow: '1-5' });
  const fmt = useMemo(() => new Intl.DateTimeFormat(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }), []);
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const expr = ORDER.map((k) => raw[k].trim() || '*').join(' ');
  const parsed = ORDER.map((k) => [k, expand(raw[k].trim() || '*', RANGES[k])] as const);
  const bad = parsed.some(([, s]) => s === null);
  const sets = bad ? null : Object.fromEntries(parsed) as Record<Key, number[]>;

  const says = (() => {
    if (!sets) return 'One of these fields is not valid cron, so there is nothing to predict.';
    const every = (k: Key) => raw[k].trim() === '*';
    const list = (arr: number[], names?: string[]) => {
      const s = names ? arr.map((i) => names[i]!) : arr.map(String);
      return s.length === 1 ? s[0]! : `${s.slice(0, -1).join(', ')} and ${s[s.length - 1]}`;
    };
    const time = every('min') ? 'every minute'
      : sets.min.length > 4 ? `${sets.min.length} times an hour` : `at minute ${list(sets.min)}`;
    const hours = every('hour') ? 'of every hour' : `past hour ${list(sets.hour)}`;
    const days = every('dow') ? (every('dom') ? 'every day' : `on day ${list(sets.dom)} of the month`)
      : `on ${list(sets.dow, DOW)}`;
    const months = every('mon') ? '' : `, in ${list(sets.mon, MON)}`;
    return `Runs ${time} ${hours}, ${days}${months}.`;
  })();

  const runs = sets ? nextRuns(sets, new Date(), 5) : [];

  return (
    <div className="grid max-w-[460px] gap-[11px]">
      <div className="grid grid-cols-3 gap-[7px] sm:grid-cols-5">
        {ORDER.map((k) => {
          const invalid = expand(raw[k].trim() || '*', RANGES[k]) === null;
          return (
            <label key={k} className="grid gap-1 text-[.7rem] text-text-dim">
              {LABELS[k]}
              <input
                value={raw[k]}
                autoComplete="off" spellCheck={false}
                aria-invalid={invalid}
                onChange={(e) => setRaw((r) => ({ ...r, [k]: e.target.value }))}
                className={`w-full rounded-[7px] border bg-bg px-2 py-[7px] text-center font-mono text-[.8rem] text-text focus:outline-none ${
                  invalid ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_7%,var(--bg))]' : 'border-border focus:border-accent'
                }`}
              />
            </label>
          );
        })}
      </div>

      <p className="m-0">
        <code className="inline-block rounded-[7px] bg-raised px-[11px] py-1.5 font-mono text-[.9rem]">{expr}</code>
      </p>

      <p role="status" aria-live="polite" className={`m-0 text-[.84rem] ${bad ? 'text-accent' : ''}`}>{says}</p>

      <div className="border-t border-border pt-[9px]">
        <p className="m-0 mb-[5px] text-[.74rem] text-text-dim">Next five runs ({tz})</p>
        <ol className="m-0 grid list-decimal gap-0.5 ps-[1.1rem] font-mono text-[.76rem] tabular-nums">
          {bad ? null : runs.length
            ? runs.map((r, i) => <li key={i}>{fmt.format(r)}</li>)
            : <li>Never — no date in the next four years matches.</li>}
        </ol>
      </div>
    </div>
  );
}
