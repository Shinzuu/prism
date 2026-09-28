import { useState } from 'react';

const SAMPLES = [
  { lang: 'th', label: 'Thai — no spaces between words',
    text: 'การจัดวางตัวอักษรที่ดีต้องรู้ว่าคำจบตรงไหนแม้ไม่มีช่องว่างคั่นระหว่างคำ' },
  { lang: 'ja', label: 'Japanese — kinsoku line-break rules',
    text: '行頭に句読点や閉じ括弧を置いてはいけません。「禁則処理」と呼ばれる規則です。' },
  { lang: 'ar', label: 'Arabic — letters must stay joined',
    text: 'النص العربي يتصل حروفه ببعضها، وكسر الكلمة يقطع هذا الاتصال ويجعلها غير مقروءة.' },
  { lang: 'en', label: 'English — for comparison',
    text: 'Latin text breaks at spaces and hyphens, which is the only rule most layout code knows.' },
];

export default function MultiscriptTextColumn() {
  const [measure, setMeasure] = useState(300);

  return (
    <div className="grid gap-[9px]">
      <div className="flex items-center gap-[9px] text-[.7rem] text-text-dim">
        <label className="flex flex-1 items-center gap-[7px]">
          Measure
          <input
            type="range" min={120} max={420} value={measure}
            onChange={(e) => setMeasure(Number(e.target.value))}
            className="min-w-0 flex-1 accent-accent"
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
        {SAMPLES.map((s) => (
          <div key={s.lang} className="grid gap-[5px] break-words rounded-[9px] border border-border bg-bg px-[10px] py-[9px]">
            <p className="m-0 font-mono text-[.6rem] text-text-dim">{s.label}</p>
            {/* lang is not metadata: the engine picks its line-breaking
                dictionary from it, and Thai has no inter-word spaces, so
                without it there are no word boundaries to find at all. */}
            <p lang={s.lang} dir={s.lang === 'ar' ? 'rtl' : undefined} className="mtc-p m-0 text-[.8rem]">
              {s.text}
            </p>
          </div>
        ))}

        {/* The same Thai, with the English default applied, so the damage is
            visible side by side rather than asserted. */}
        <div className="grid gap-[5px] rounded-[9px] border border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] bg-bg px-[10px] py-[9px]">
          <p className="m-0 font-mono text-[.6rem] text-text-dim">Thai with word-break: break-all</p>
          <p lang="th" className="mtc-p mtc-bad m-0 text-[.8rem]">{SAMPLES[0]!.text}</p>
        </div>
      </div>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        Narrow the column. Thai wraps without spaces, Japanese refuses to start a line with 。or 」,
        and Arabic keeps its letters joined — none of which happens if the text is treated as English.
      </p>
    </div>
  );
}
