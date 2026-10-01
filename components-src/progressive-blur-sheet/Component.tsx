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

const DEFAULT_BARS = [42, 78, 30, 95, 61, 48];

export interface ProgressiveBlurSheetProps {
  /** Intro line above the trigger. */
  intro?: string;
  /** Label of the button that opens the sheet. */
  triggerLabel?: string;
  /** Heading of the sample card behind the sheet. */
  cardTitle?: string;
  /** Caption of the sample card behind the sheet. */
  cardCaption?: string;
  /** Bar heights (0–100) drawn in the sample card, so the blur has detail to act on. */
  bars?: number[];
  /** Heading of the sheet. */
  title?: string;
  /** Body copy of the sheet. */
  description?: string;
  /** Label of the dismiss button. */
  cancelLabel?: string;
  /** Label of the primary button. */
  confirmLabel?: string;
  /** Disables the trigger so the sheet cannot be opened. */
  disabled?: boolean;
  /** Fired when the sheet opens. */
  onOpen?: () => void;
  /** Fired when the primary button is pressed. */
  onConfirm?: () => void;
  /** Fired when the sheet is dismissed with the cancel button or Escape. */
  onCancel?: () => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function ProgressiveBlurSheet({
  intro = 'A flat dim reads as a sheet of grey laid over the page. A gradient of blur reads as depth.',
  triggerLabel = 'Open sheet',
  cardTitle = 'Deployment 41c9',
  cardCaption = 'Content behind the sheet, so the blur has something to act on.',
  bars = DEFAULT_BARS,
  title = 'Roll back to 41c9?',
  description = 'Traffic shifts over about ninety seconds. The blur under this panel is a gradient, not a flat scrim — sharpest far from the sheet, deepest right against it.',
  cancelLabel = 'Cancel',
  confirmLabel = 'Roll back',
  disabled = false,
  onOpen,
  onConfirm,
  onCancel,
  className = '',
}: ProgressiveBlurSheetProps) {
  const sheet = useRef<HTMLDialogElement>(null);

  return (
    <div className={`grid gap-[10px] ${className}`}>
      <p className="m-0 text-[.74rem] leading-relaxed text-text-dim">
        {intro}
      </p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => { sheet.current?.showModal(); onOpen?.(); }}
        className="justify-self-start cursor-pointer rounded-lg border border-transparent bg-accent
                   px-[14px] py-2 font-sans text-[.8rem] text-accent-fg
                   hover:brightness-[1.08] active:translate-y-px
                   focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
                   disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:translate-y-0"
      >
        {triggerLabel}
      </button>

      <div aria-hidden className="rounded-[10px] border border-border bg-raised px-[14px] py-3">
        <p className="m-0 mb-[3px] text-[.8rem] font-medium">{cardTitle}</p>
        <p className="m-0 mb-[10px] text-[.72rem] text-text-dim">
          {cardCaption}
        </p>
        <div className="flex h-[34px] items-end gap-[5px]">
          {bars.map((h, i) => (
            <i key={i} className="flex-1 rounded-sm bg-accent opacity-50" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* The dialog fills the frame and keeps a transparent ::backdrop, because
          the graduated veil is doing that job and ::backdrop cannot be stacked. */}
      <dialog
        ref={sheet}
        onCancel={() => onCancel?.()}
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
          <p className="m-0 mb-[6px] text-[.88rem] font-medium">{title}</p>
          <p className="m-0 mb-[14px] text-[.76rem] leading-relaxed text-text-dim">
            {description}
          </p>
          <div className="flex justify-end gap-2">
            {[
              { key: 'cancel', label: cancelLabel, cls: 'border-border bg-transparent text-text hover:border-accent', act: onCancel },
              { key: 'confirm', label: confirmLabel, cls: 'border-transparent bg-accent text-accent-fg hover:brightness-[1.08]', act: onConfirm },
            ].map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => { sheet.current?.close(); b.act?.(); }}
                className={`cursor-pointer rounded-lg border px-[14px] py-2 font-sans text-[.8rem] ${b.cls}
                            active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
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
