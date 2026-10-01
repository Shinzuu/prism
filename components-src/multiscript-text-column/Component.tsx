import { useState } from 'react';

export type ScriptSample = {
  lang: string;
  label: string;
  text: string;
  /** Falls back to rtl for Arabic, ltr otherwise. */
  dir?: 'ltr' | 'rtl';
};

const DEFAULT_SAMPLES: ScriptSample[] = [
  { lang: 'th', label: 'Thai — no spaces between words',
    text: 'การจัดวางตัวอักษรที่ดีต้องรู้ว่าคำจบตรงไหนแม้ไม่มีช่องว่างคั่นระหว่างคำ' },
  { lang: 'ja', label: 'Japanese — kinsoku line-break rules',
    text: '行頭に句読点や閉じ括弧を置いてはいけません。「禁則処理」と呼ばれる規則です。' },
  { lang: 'ar', label: 'Arabic — letters must stay joined',
    text: 'النص العربي يتصل حروفه ببعضها، وكسر الكلمة يقطع هذا الاتصال ويجعلها غير مقروءة.' },
  { lang: 'en', label: 'English — for comparison',
    text: 'Latin text breaks at spaces and hyphens, which is the only rule most layout code knows.' },
];

const DEFAULT_COMPARISON: ScriptSample = {
  lang: 'th',
  label: 'Thai with word-break: break-all',
  text: DEFAULT_SAMPLES[0]!.text,
};

const DEFAULT_CAPTION =
  'Narrow the column. Thai wraps without spaces, Japanese refuses to start a line with 。or 」, ' +
  'and Arabic keeps its letters joined — none of which happens if the text is treated as English.';

export interface MultiscriptTextColumnProps {
  /** Text samples, one card each; `lang` drives the engine's line breaking. */
  samples?: ScriptSample[];
  /** The same text rendered with the naive English rule, for contrast. Pass null to hide it. */
  comparison?: ScriptSample | null;
  /** Starting column measure in px. */
  defaultMeasure?: number;
  /** Narrowest measure the slider allows, in px. */
  minMeasure?: number;
  /** Widest measure the slider allows, in px. */
  maxMeasure?: number;
  /** Label beside the measure slider. */
  measureLabel?: string;
  /** Explanatory line under the columns. Empty string hides it. */
  caption?: string;
  /** Locks the measure slider. */
  disabled?: boolean;
  /** Fires with the new measure in px whenever the slider moves. */
  onMeasureChange?: (px: number) => void;
  /** Extra classes for the root element. */
  className?: string;
}

export default function MultiscriptTextColumn({
  samples = DEFAULT_SAMPLES,
  comparison = DEFAULT_COMPARISON,
  defaultMeasure = 300,
  minMeasure = 120,
  maxMeasure = 420,
  measureLabel = 'Measure',
  caption = DEFAULT_CAPTION,
  disabled = false,
  onMeasureChange,
  className = '',
}: MultiscriptTextColumnProps) {
  const [measure, setMeasure] = useState(defaultMeasure);

  return (
    <div className={`grid gap-[9px] ${className}`}>
      <div className="flex items-center gap-[9px] text-[.7rem] text-text-dim">
        <label className="flex flex-1 items-center gap-[7px]">
          {measureLabel}
          <input
            type="range" min={minMeasure} max={maxMeasure} value={measure}
            disabled={disabled}
            onChange={(e) => {
              const px = Number(e.target.value);
              setMeasure(px);
              onMeasureChange?.(px);
            }}
            className="min-w-0 flex-1 cursor-pointer accent-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <span className="font-mono text-[.66rem] tabular-nums">{measure}px</span>
      </div>

      <div
        className="mtc-cols grid items-start gap-[9px]"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${measure}px, 1fr))`,
          maxWidth: `${measure * 2 + 20}px`,
        }}
      >
        {samples.map((s) => (
          <div key={s.lang} className="grid gap-[5px] break-words rounded-[9px] border border-border bg-bg px-[10px] py-[9px]">
            <p className="m-0 font-mono text-[.6rem] text-text-dim">{s.label}</p>
            {/* lang is not metadata: the engine picks its line-breaking
                dictionary from it, and Thai has no inter-word spaces, so
                without it there are no word boundaries to find at all. */}
            <p lang={s.lang} dir={s.dir ?? (s.lang === 'ar' ? 'rtl' : undefined)} className="mtc-p m-0 text-[.8rem]">
              {s.text}
            </p>
          </div>
        ))}

        {/* The same Thai, with the English default applied, so the damage is
            visible side by side rather than asserted. */}
        {comparison && (
          <div className="grid gap-[5px] rounded-[9px] border border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] bg-bg px-[10px] py-[9px]">
            <p className="m-0 font-mono text-[.6rem] text-text-dim">{comparison.label}</p>
            <p lang={comparison.lang} dir={comparison.dir} className="mtc-p mtc-bad m-0 text-[.8rem]">{comparison.text}</p>
          </div>
        )}
      </div>

      {caption && (
        <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
          {caption}
        </p>
      )}
    </div>
  );
}
