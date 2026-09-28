import { useState } from 'react';

const ROOT_PX = 16;
const UNITS = ['px', 'rem', 'em', '%', 'ch', 'vw', 'vh', 'cqi'];
const RE = /^\s*(-?\d*\.?\d+)\s*([a-z%]*)\s*$/i;

type Value = { n: number; u: string };

function parse(raw: string): Value | null {
  const m = RE.exec(raw);
  if (!m) return null;
  const n = parseFloat(m[1]!);
  const u = (m[2] ?? '').toLowerCase();
  if (!Number.isFinite(n)) return null;
  if (u && !UNITS.includes(u)) return null;
  return { n, u: u || 'px' };
}

function decimals(raw: string) {
  const dot = raw.indexOf('.');
  return dot === -1 ? 0 : raw.length - dot - 1;
}

/* A number that remembers it has a unit. Arrow keys step the value and leave
   the unit alone — the thing a plain number input cannot do, and the reason
   designers end up retyping "px" forty times a day. */
export default function UnitField() {
  const [raw, setRaw] = useState('1.5rem');
  const v = parse(raw);

  const step = (dir: number, e: React.KeyboardEvent) => {
    if (!v) return;
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    // Step in the unit's own granularity: 1px is coarse, 1rem is enormous.
    const base = v.u === 'px' || v.u === '%' || v.u === 'vw' || v.u === 'vh' ? 1 : 0.1;
    const next = v.n + dir * base * mult;
    const dp = Math.max(decimals(String(base * mult)), 0);
    const num = (Math.abs(next) < 1e-6 ? 0 : +next.toFixed(dp + 2)).toString().replace(/\.?0+$/, '');
    setRaw(num + v.u);
  };

  // Only conversions that are actually defined without layout context.
  const px = !v ? null : v.u === 'px' ? v.n : v.u === 'rem' || v.u === 'em' ? v.n * ROOT_PX : null;
  const pairs: [string, string][] =
    px !== null
      ? [['px', px.toFixed(px % 1 ? 2 : 0)], ['rem', (px / ROOT_PX).toFixed(4).replace(/\.?0+$/, '')]]
      : [['relative', 'depends on container']];

  return (
    <div className="grid max-w-[340px] gap-[7px]">
      <label className="text-[.84rem] font-medium" htmlFor="uf-in">Inline size</label>
      <div className="relative flex items-center">
        <input
          id="uf-in"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          aria-describedby="uf-help"
          aria-invalid={!v}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); step(1, e); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); step(-1, e); }
          }}
          // Normalise only on blur, never while typing.
          onBlur={() => { if (v) setRaw(`${v.n}${v.u}`); }}
          className={`flex-1 rounded-[9px] border bg-bg py-[10px] pl-[13px] pr-14 font-mono text-[.92rem] tabular-nums text-text focus:outline-none ${
            v ? 'border-border focus:border-accent' : 'border-[color-mix(in_oklab,var(--accent)_60%,var(--text))]'
          }`}
        />
        <span className="pointer-events-none absolute right-3 font-mono text-[.78rem] text-text-dim">
          {v ? v.u : ''}
        </span>
      </div>
      <p className="m-0 text-[.74rem] text-text-dim" id="uf-help">
        Arrow keys step the number and keep the unit. Shift for ten, Alt for a tenth.
      </p>
      {v && (
        <dl className="m-0 mt-1 flex flex-wrap gap-x-[14px] gap-y-1 text-[.74rem]">
          {pairs.map(([k, val]) => (
            <div key={k} className="flex">
              <dt className="font-mono text-text-dim">{k}</dt>
              <dd className="m-0 ml-1 font-mono tabular-nums">{val}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
