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

/** Lightness in percent (0–100), chroma (0–0.37), hue in degrees (0–360). */
export type OklchColor = { l: number; c: number; h: number };

const DEFAULT_COLOR: OklchColor = { l: 62, c: 0.18, h: 28 };

export interface OklchPickerProps {
  /** Starting colour. */
  defaultValue?: OklchColor;
  /** Fires on every slider move with the new colour and its CSS string. */
  onChange?: (color: OklchColor, css: string) => void;
  /** Fires after the CSS string has been copied to the clipboard. */
  onCopy?: (css: string) => void;
  /** Copy button text at rest. */
  copyLabel?: string;
  /** Copy button text after a successful copy. */
  copiedLabel?: string;
  /** Copy button text when the clipboard refuses. */
  copyFailedLabel?: string;
  /** How long the copy feedback stays, in ms. */
  copyFeedbackMs?: number;
  /** Shown when the colour falls outside sRGB. */
  gamutWarning?: string;
  /** Locks the sliders and the copy button. */
  disabled?: boolean;
  /** Extra classes for the root element. */
  className?: string;
}

export default function OklchPicker({
  defaultValue = DEFAULT_COLOR,
  onChange,
  onCopy,
  copyLabel = 'copy',
  copiedLabel = 'copied',
  copyFailedLabel = 'copy failed',
  copyFeedbackMs = 1400,
  gamutWarning = 'Outside the sRGB gamut — this is the nearest displayable colour.',
  disabled = false,
  className = '',
}: OklchPickerProps) {
  const [l, setL] = useState(defaultValue.l);
  const [c, setC] = useState(defaultValue.c);
  const [h, setH] = useState(defaultValue.h);
  const [outOfGamut, setOutOfGamut] = useState(false);
  const [copy, setCopy] = useState(copyLabel);
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
    <div className={`grid max-w-[420px] gap-3 ${className}`}>
      <div className="h-24 rounded-xl border border-border" style={{ background: value }} />

      <div className="grid gap-[9px]">
        {AXES.map((a) => (
          <label key={a.k} className="grid grid-cols-[5.4rem_1fr_4.2rem] items-center gap-[10px] text-[.82rem] text-text-dim">
            <span>{a.label}</span>
            <input
              type="range" min={a.min} max={a.max} step={a.step} value={val[a.k]}
              disabled={disabled}
              onChange={(e) => {
                const v = Number(e.target.value);
                setter[a.k](v);
                const next = { ...val, [a.k]: v };
                onChange?.(next, css(next.l, next.c, next.h));
              }}
              style={{ '--ramp': ramp(a.k) } as React.CSSProperties}
              className="op-range disabled:opacity-50"
            />
            <output className="text-right font-mono text-[.76rem] tabular-nums text-text">{fmt[a.k]}</output>
          </label>
        ))}
      </div>

      {outOfGamut && (
        <p className="m-0 text-[.76rem] text-accent">
          {gamutWarning}
        </p>
      )}

      <p className="m-0 flex items-center gap-[10px] text-[.8rem]">
        <code className="rounded-md bg-raised px-[9px] py-1 font-mono">{value}</code>
        <button
          type="button"
          disabled={disabled}
          onClick={async () => {
            try { await navigator.clipboard.writeText(value); setCopy(copiedLabel); onCopy?.(value); }
            catch { setCopy(copyFailedLabel); }
            setTimeout(() => setCopy(copyLabel), copyFeedbackMs);
          }}
          className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[.74rem] text-text-dim underline underline-offset-[3px] hover:text-accent active:opacity-70 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-text-dim"
        >
          {copy}
        </button>
      </p>
    </div>
  );
}
