import { useEffect, useRef, useState } from 'react';

/* Dragging lightness must not change apparent hue, which is the entire reason
   to pick in OKLCH rather than HSL. The ramp behind each slider previews the
   axis being dragged, and the gamut warning is MEASURED by painting the colour
   and reading the pixel back rather than guessed from a formula. */
const AXES = [
  { k: 'l' as const, label: 'Lightness', min: 0, max: 100, step: 0.5 },
  { k: 'c' as const, label: 'Chroma', min: 0, max: 0.37, step: 0.005 },
  { k: 'h' as const, label: 'Hue', min: 0, max: 360, step: 1 },
];

const css = (l: number, c: number, h: number) => `oklch(${l}% ${c} ${h})`;

export default function OklchPicker() {
  const [l, setL] = useState(62);
  const [c, setC] = useState(0.18);
  const [h, setH] = useState(28);
  const [outOfGamut, setOutOfGamut] = useState(false);
  const [copy, setCopy] = useState('copy');
  const ctx = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    ctx.current = cv.getContext('2d', { willReadFrequently: true });
  }, []);

  const value = css(l, c, h);

  useEffect(() => {
    const g = ctx.current;
    if (!g) return;
    /* Ask the browser to paint it, then ask what it painted: outside sRGB the
       values come back clipped. */
    g.clearRect(0, 0, 1, 1);
    g.fillStyle = '#000';
    g.fillStyle = value;
    g.fillRect(0, 0, 1, 1);
    const [r, gr, b] = [...g.getImageData(0, 0, 1, 1).data].slice(0, 3) as [number, number, number];
    const clipped = r === 0 && gr === 0 && b === 0 && l > 5;
    const atEdge = [r, gr, b].some((v) => v === 0 || v === 255) && c > 0.08;
    setOutOfGamut(clipped || atEdge);
  }, [value, l, c]);

  const ramp = (k: 'l' | 'c' | 'h') => {
    const stops = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      return k === 'l' ? css(t * 100, c, h) : k === 'c' ? css(l, t * 0.37, h) : css(l, c, t * 360);
    });
    return `linear-gradient(to right, ${stops.join(',')})`;
  };

  const val = { l, c, h };
  const setter = { l: setL, c: setC, h: setH };
  const fmt = { l: `${l.toFixed(1)}%`, c: c.toFixed(3), h: `${h}°` };

  return (
    <div className="grid max-w-[420px] gap-3">
      <div className="h-24 rounded-xl border border-border" style={{ background: value }} />

      <div className="grid gap-[9px]">
        {AXES.map((a) => (
          <label key={a.k} className="grid grid-cols-[5.4rem_1fr_4.2rem] items-center gap-[10px] text-[.82rem] text-text-dim">
            <span>{a.label}</span>
            <input
              type="range" min={a.min} max={a.max} step={a.step} value={val[a.k]}
              onChange={(e) => setter[a.k](Number(e.target.value))}
              style={{ '--ramp': ramp(a.k) } as React.CSSProperties}
              className="op-range"
            />
            <output className="text-right font-mono text-[.76rem] tabular-nums text-text">{fmt[a.k]}</output>
          </label>
        ))}
      </div>

      {outOfGamut && (
        <p className="m-0 text-[.76rem] text-accent">
          Outside the sRGB gamut — this is the nearest displayable colour.
        </p>
      )}

      <p className="m-0 flex items-center gap-[10px] text-[.8rem]">
        <code className="rounded-md bg-raised px-[9px] py-1 font-mono">{value}</code>
        <button
          type="button"
          onClick={async () => {
            try { await navigator.clipboard.writeText(value); setCopy('copied'); }
            catch { setCopy('copy failed'); }
            setTimeout(() => setCopy('copy'), 1400);
          }}
          className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[.74rem] text-text-dim underline underline-offset-[3px] hover:text-accent"
        >
          {copy}
        </button>
      </p>
    </div>
  );
}
