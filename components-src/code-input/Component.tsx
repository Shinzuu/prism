import { useRef, useState } from 'react';

const LENGTH = 6;
const onlyDigits = (s: string) => (s.match(/\d/g) ?? []).join('');

/* The boxes are not the hard part. Paste across all slots, backspace into the
   previous slot, arrow navigation, and mobile autofill delivering the whole
   code into a single field are. */
export default function CodeInput() {
  const [vals, setVals] = useState<string[]>(Array(LENGTH).fill(''));
  const [state, setState] = useState<'' | 'done' | 'bad'>('');
  const [status, setStatus] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const check = (next: string[]) => {
    const v = next.join('');
    if (v.length < LENGTH || next.some((d) => d === '')) { setState(''); setStatus(''); return; }
    // Stand-in for a real check. Anything but 000000 is accepted.
    const ok = v !== '000000';
    setState(ok ? 'done' : 'bad');
    setStatus(ok ? 'Code accepted.' : 'That code is not valid. Check and try again.');
    if (!ok) {
      setVals(Array(LENGTH).fill(''));
      refs.current[0]?.focus();
    }
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
      id={i === 0 ? 'ci-0' : undefined}
      ref={(el) => { refs.current[i] = el; }}
      inputMode="numeric"
      autoComplete={i === 0 ? 'one-time-code' : undefined}
      maxLength={1}
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
        } else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); refs.current[i - 1]?.focus(); }
        else if (e.key === 'ArrowRight' && i < LENGTH - 1) { e.preventDefault(); refs.current[i + 1]?.focus(); }
      }}
      onPaste={(e) => { e.preventDefault(); fill(i, e.clipboardData.getData('text')); }}
      data-filled={vals[i] ? 'true' : 'false'}
      className={`ci-slot h-[54px] w-11 rounded-[10px] border bg-surface text-center font-mono text-[1.25rem] text-text
                  focus:border-accent focus:bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface))] focus:outline-none ${
        state === 'done' ? 'border-accent'
        : state === 'bad' ? 'border-[color-mix(in_oklab,var(--accent)_70%,var(--border))]'
        : vals[i] ? 'border-[color-mix(in_oklab,var(--accent)_55%,var(--border))]'
        : 'border-border hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border))]'
      }`}
    />
  );

  return (
    <form className="grid max-w-[420px] gap-1" onSubmit={(e) => e.preventDefault()} noValidate>
      <label className="text-[.92rem] font-medium" htmlFor="ci-0">Verification code</label>
      <p className="m-0 mb-[10px] text-[.8rem] text-text-dim" id="ci-help">
        Six digits, sent to your device. Paste works.
      </p>

      <div
        role="group"
        aria-labelledby="ci-help"
        className={`flex items-center gap-2 ${state === 'bad' ? 'ci-shake' : ''}`}
      >
        {slot(0)}{slot(1)}{slot(2)}
        <span className="h-px w-[10px] bg-border" aria-hidden />
        {slot(3)}{slot(4)}{slot(5)}
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
