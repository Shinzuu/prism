import { useRef } from 'react';

/* Four stacked layers. Each blurs more than the one below and is masked to a
   narrower band, so the visible radius ramps instead of stepping. One
   backdrop-filter cannot do this — a filter takes a single uniform radius, and
   masking one blurred layer only fades that layer out, revealing the sharp
   page underneath rather than a weaker blur. */
const VEIL = [
  { blur: '2px', from: '0%' },
  { blur: '6px', from: '28%' },
  { blur: '14px', from: '52%' },
  { blur: '28px', from: '74%' },
];

const BARS = [42, 78, 30, 95, 61, 48];

export default function ProgressiveBlurSheet() {
  const sheet = useRef<HTMLDialogElement>(null);

  return (
    <div className="grid gap-[10px]">
      <p className="m-0 text-[.74rem] leading-relaxed text-text-dim">
        A flat dim reads as a sheet of grey laid over the page. A gradient of blur reads as depth.
      </p>

      <button
        type="button"
        onClick={() => sheet.current?.showModal()}
        className="justify-self-start cursor-pointer rounded-lg border border-transparent bg-accent
                   px-[14px] py-2 font-sans text-[.8rem] text-accent-fg
                   focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Open sheet
      </button>

      <div aria-hidden className="rounded-[10px] border border-border bg-raised px-[14px] py-3">
        <p className="m-0 mb-[3px] text-[.8rem] font-medium">Deployment 41c9</p>
        <p className="m-0 mb-[10px] text-[.72rem] text-text-dim">
          Content behind the sheet, so the blur has something to act on.
        </p>
        <div className="flex h-[34px] items-end gap-[5px]">
          {BARS.map((h, i) => (
            <i key={i} className="flex-1 rounded-sm bg-accent opacity-50" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* The dialog fills the frame and keeps a transparent ::backdrop, because
          the graduated veil is doing that job and ::backdrop cannot be stacked. */}
      <dialog
        ref={sheet}
        className="pbs-sheet m-0 inset-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0"
      >
        <div aria-hidden className="absolute inset-0">
          {VEIL.map((v) => (
            <div
              key={v.blur}
              className="absolute inset-0"
              style={{
                backdropFilter: `blur(${v.blur})`,
                WebkitBackdropFilter: `blur(${v.blur})`,
                maskImage: `linear-gradient(to bottom, transparent ${v.from}, black calc(${v.from} + 24%))`,
                WebkitMaskImage: `linear-gradient(to bottom, transparent ${v.from}, black calc(${v.from} + 24%))`,
              }}
            />
          ))}
        </div>

        <div className="pbs-panel absolute inset-x-0 bottom-0 rounded-t-[14px] border-t border-border bg-raised px-4 pb-[18px] pt-4">
          <p className="m-0 mb-[6px] text-[.88rem] font-medium">Roll back to 41c9?</p>
          <p className="m-0 mb-[14px] text-[.76rem] leading-relaxed text-text-dim">
            Traffic shifts over about ninety seconds. The blur under this panel is a gradient, not a
            flat scrim — sharpest far from the sheet, deepest right against it.
          </p>
          <div className="flex justify-end gap-2">
            {[
              { label: 'Cancel', cls: 'border-border bg-transparent text-text' },
              { label: 'Roll back', cls: 'border-transparent bg-accent text-accent-fg' },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => sheet.current?.close()}
                className={`cursor-pointer rounded-lg border px-[14px] py-2 font-sans text-[.8rem] ${b.cls}
                            focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </div>
  );
}
