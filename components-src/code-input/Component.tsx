import { useRef, useState } from 'react';

const onlyDigits = (s: string) => (s.match(/\d/g) ?? []).join('');
// Stand-in for a real check. Anything but all zeros is accepted.
const DEFAULT_VALIDATE = (code: string) => !/^0+$/.test(code);

export interface CodeInputProps {
  /** Number of digit slots. */
  length?: number;
  /** Slot index before which the visual separator sits; 0 hides it. */
  splitAt?: number;
  /** Visible label above the slots. */
  label?: string;
  /** Help text under the label, also the group's accessible name. */
  hint?: string;
  /** Status text when the code is accepted. */
  acceptedText?: string;
  /** Status text when the code is rejected. */
  rejectedText?: string;
  /** Status text while an async check is pending. */
  checkingText?: string;
  /** Checks a complete code; may return a promise for a server round-trip. */
  validate?: (code: string) => boolean | Promise<boolean>;
  /** Prefix for element ids, so several instances can share a page. */
  idPrefix?: string;
  /** Disables every slot. */
  disabled?: boolean;
  /** Fired on every edit with the current (possibly partial) code. */
  onChange?: (code: string) => void;
  /** Fired once a complete code has been checked. */
  onComplete?: (code: string, ok: boolean) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

/* The boxes are not the hard part. Paste across all slots, backspace into the
   previous slot, arrow navigation, and mobile autofill delivering the whole
   code into a single field are. */
export default function CodeInput({
  length: LENGTH = 6,
  splitAt = Math.floor(LENGTH / 2),
  label = 'Verification code',
  hint = 'Six digits, sent to your device. Paste works.',
  acceptedText = 'Code accepted.',
  rejectedText = 'That code is not valid. Check and try again.',
  checkingText = 'Checking…',
  validate = DEFAULT_VALIDATE,
  idPrefix = 'ci',
  disabled = false,
  onChange,
  onComplete,
  className = '',
}: CodeInputProps) {
  const [vals, setVals] = useState<string[]>(Array<string>(LENGTH).fill(''));
  const [state, setState] = useState<'' | 'done' | 'bad' | 'checking'>('');
  const [status, setStatus] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Lets a slow check that was overtaken by a newer edit be ignored.
  const checkId = useRef(0);

  const settle = (v: string, ok: boolean, async = false) => {
    setState(ok ? 'done' : 'bad');
    setStatus(ok ? acceptedText : rejectedText);
    onComplete?.(v, ok);
    if (!ok) {
      setVals(Array<string>(LENGTH).fill(''));
      // After an async check the slots are still disabled until this render lands.
      if (async) setTimeout(() => refs.current[0]?.focus());
      else refs.current[0]?.focus();
    }
  };

  const check = (next: string[]) => {
    const v = next.join('');
    onChange?.(v);
    const id = ++checkId.current;
    if (v.length < LENGTH || next.some((d) => d === '')) { setState(''); setStatus(''); return; }
    const result = validate(v);
    if (typeof result === 'boolean') { settle(v, result); return; }
    setState('checking');
    setStatus(checkingText);
    result.then((ok) => { if (id === checkId.current) settle(v, ok, true); },
      () => { if (id === checkId.current) settle(v, false, true); });
  };

  const fill = (from: number, text: string) => {
    const d = onlyDigits(text);
    if (!d) return;
    const next = [...vals];
    for (let i = 0; i < d.length && from + i < LENGTH; i++) next[from + i] = d[i]!;
    setVals(next);
    const to = Math.min(from + d.length, LENGTH - 1);
    refs.current[to]?.focus();
    refs.current[to]?.select();
    check(next);
  };

  const slot = (i: number) => (
    <input
      key={i}
      id={i === 0 ? `${idPrefix}-0` : undefined}
      ref={(el) => { refs.current[i] = el; }}
      inputMode="numeric"
      autoComplete={i === 0 ? 'one-time-code' : undefined}
      maxLength={1}
      disabled={disabled || state === 'checking'}
      aria-label={`Digit ${i + 1} of ${LENGTH}`}
      value={vals[i] ?? ''}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const raw = e.target.value;
        // Autofill and some keyboards deliver the whole code into one slot.
        if (raw.length > 1) { fill(i, raw); return; }
        const next = [...vals];
        next[i] = onlyDigits(raw).slice(0, 1);
        setVals(next);
        if (next[i] && i < LENGTH - 1) refs.current[i + 1]?.focus();
        check(next);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Backspace' && !vals[i] && i > 0) {
          e.preventDefault();
          const next = [...vals];
          next[i - 1] = '';
          setVals(next);
          refs.current[i - 1]?.focus();
          onChange?.(next.join(''));
        } else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); refs.current[i - 1]?.focus(); }
        else if (e.key === 'ArrowRight' && i < LENGTH - 1) { e.preventDefault(); refs.current[i + 1]?.focus(); }
      }}
      onPaste={(e) => { e.preventDefault(); fill(i, e.clipboardData.getData('text')); }}
      data-filled={vals[i] ? 'true' : 'false'}
      className={`ci-slot h-[54px] w-11 rounded-[10px] border bg-surface text-center font-mono text-[1.25rem] text-text
                  focus:border-accent focus:bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface))] focus:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50 ${
        state === 'done' ? 'border-accent'
        : state === 'bad' ? 'border-[color-mix(in_oklab,var(--accent)_70%,var(--border))]'
        : vals[i] ? 'border-[color-mix(in_oklab,var(--accent)_55%,var(--border))]'
        : 'border-border hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border))]'
      }`}
    />
  );

  return (
    <form className={`grid max-w-[420px] gap-1 ${className}`} onSubmit={(e) => e.preventDefault()} noValidate>
      <label className="text-[.92rem] font-medium" htmlFor={`${idPrefix}-0`}>{label}</label>
      <p className="m-0 mb-[10px] text-[.8rem] text-text-dim" id={`${idPrefix}-help`}>
        {hint}
      </p>

      <div
        role="group"
        aria-labelledby={`${idPrefix}-help`}
        aria-busy={state === 'checking' || undefined}
        className={`flex items-center gap-2 ${state === 'bad' ? 'ci-shake' : ''}`}
      >
        {Array.from({ length: LENGTH }, (_, i) => i).flatMap((i) => (i > 0 && i === splitAt
          ? [<span key="sep" className="h-px w-[10px] bg-border" aria-hidden />, slot(i)]
          : [slot(i)]))}
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`m-0 mt-3 min-h-[1.2em] text-[.82rem] ${state === 'done' ? 'text-accent' : 'text-text-dim'}`}
      >
        {status}
      </p>
    </form>
  );
}
