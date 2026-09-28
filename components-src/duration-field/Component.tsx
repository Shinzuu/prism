import { useState } from 'react';

const UNITS: Record<string, number> = { d: 86400, h: 3600, m: 60, s: 1 };

/* The parse IS the component; the field is incidental. It accepts how people
   actually write durations, then shows exactly what it understood. */
function parse(rawIn: string): number | null {
  const s = rawIn.trim().toLowerCase();
  if (!s) return null;

  // Clock form: 1:30 is an hour and a half, 1:30:05 adds seconds.
  const clock = /^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/.exec(s);
  if (clock) return +clock[1]! * 3600 + +clock[2]! * 60 + +(clock[3] ?? 0);

  // Unit form: "2h30", "2h 30m", "1d4h", "90m", "45s".
  const re = /(\d+(?:\.\d+)?)\s*(d|h|m|s|days?|hours?|mins?|minutes?|secs?|seconds?)?/g;
  let total = 0, seen = 0, lastUnit: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (!m[0].trim()) continue;
    const n = parseFloat(m[1]!);
    let u = (m[2] ?? '')[0] ?? '';
    if (!u) {
      /* A bare number after a unit inherits the next smaller one: "2h30" is two
         hours thirty minutes, which is how people write it. */
      if (lastUnit === 'd') u = 'h';
      else if (lastUnit === 'h') u = 'm';
      else if (lastUnit === 'm') u = 's';
      else u = 'm';                       // a bare number alone means minutes
    }
    if (!(u in UNITS)) return null;
    total += n * UNITS[u]!;
    lastUnit = u;
    seen++;
  }
  return seen ? Math.round(total) : null;
}

function format(total: number) {
  if (total === 0) return '0s';
  const parts: string[] = [];
  let left = total;
  for (const [u, size] of Object.entries(UNITS)) {
    const n = Math.floor(left / size);
    if (n) { parts.push(`${n}${u}`); left -= n * size; }
  }
  return parts.join(' ');
}

function words(total: number) {
  const d = Math.floor(total / 86400), h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60), s = total % 60;
  const bits: string[] = [];
  if (d) bits.push(`${d} ${d === 1 ? 'day' : 'days'}`);
  if (h) bits.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  if (m) bits.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  if (s) bits.push(`${s} ${s === 1 ? 'second' : 'seconds'}`);
  return bits.join(', ');
}

export default function DurationField() {
  const [raw, setRaw] = useState('2h 30m');
  const total = parse(raw);
  const bad = total === null;

  return (
    <div className="grid max-w-[340px] gap-[6px]">
      <label className="text-[.84rem] font-medium" htmlFor="df-in">Timeout</label>
      <input
        id="df-in"
        type="text"
        autoComplete="off"
        spellCheck={false}
        aria-describedby="df-help"
        aria-invalid={bad}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        // Normalise only on blur, never mid-keystroke.
        onBlur={() => { if (total !== null) setRaw(format(total)); }}
        onKeyDown={(e) => {
          if (total === null) return;
          const step = e.shiftKey ? 3600 : e.altKey ? 1 : 60;
          if (e.key === 'ArrowUp') { e.preventDefault(); setRaw(format(total + step)); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); setRaw(format(Math.max(0, total - step))); }
        }}
        className={`rounded-[9px] border bg-bg px-[13px] py-[10px] font-mono text-[.92rem] tabular-nums text-text focus:outline-none ${
          bad ? 'border-[color-mix(in_oklab,var(--accent)_55%,var(--text))]' : 'border-border focus:border-accent'
        }`}
      />
      <p className="m-0 text-[.74rem] text-text-dim" id="df-help">
        Try {['90m', '1:30', '2h30', '1d 4h', '45s'].map((c, i) => (
          <span key={c}>
            {i > 0 && ', '}
            <code className="rounded bg-raised px-[5px] py-px font-mono">{c}</code>
          </span>
        ))}.
      </p>
      <p
        role="status"
        aria-live="polite"
        className={`m-0 mt-0.5 min-h-[1.2em] text-[.78rem] tabular-nums ${bad ? 'text-accent' : 'text-text-dim'}`}
      >
        {bad ? 'Not a duration yet.' : `${format(total)} · ${words(total)} · ${total}s`}
      </p>
    </div>
  );
}
