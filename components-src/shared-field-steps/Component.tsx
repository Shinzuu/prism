import { useLayoutEffect, useRef, useState } from 'react';

const STEPS = [
  { title: 'Who is travelling', fields: ['name', 'email'] },
  { title: 'Where to', fields: ['name', 'email', 'city', 'dates'] },
  { title: 'Confirm', fields: ['name', 'email', 'city'] },
];
const LABELS: Record<string, string> = {
  name: 'Full name', email: 'Email', city: 'Destination city', dates: 'Travel dates',
};

export default function SharedFieldSteps() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState('');
  const hostRef = useRef<HTMLDivElement>(null);
  const first = useRef<Map<string, number>>(new Map());
  const prevFields = useRef<string[]>(STEPS[0]!.fields);

  /* Fields that PERSIST move; only genuinely new ones fade. Fading a field the
     user already filled says it went away and came back, which is the wrong
     claim about a value they typed two steps ago. */
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const el of Array.from(host.children) as HTMLElement[]) {
      /* Clear first. React does not manage this attribute, so one set on mount
         would stay set forever and every field would keep fading. */
      el.removeAttribute('data-new');
      const key = el.dataset.key!;
      const was = first.current.get(key);
      if (was == null) { el.dataset.new = ''; continue; }   // genuinely new
      if (reduced) continue;
      const now = el.getBoundingClientRect().top;
      const dy = was - now;
      if (!dy) continue;                                    // no shimmer for free
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
        { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    first.current.clear();
  }, [step]);

  const go = (to: number) => {
    const host = hostRef.current;
    if (host) {
      first.current = new Map(
        (Array.from(host.children) as HTMLElement[]).map((el) => [el.dataset.key!, el.getBoundingClientRect().top])
      );
    }
    prevFields.current = STEPS[step]!.fields;
    setStep(to);
  };

  const fields = STEPS[step]!.fields;

  return (
    <form className="grid gap-[10px]" onSubmit={(e) => e.preventDefault()} noValidate>
      <ol aria-hidden className="m-0 flex list-none gap-[5px] p-0">
        {STEPS.map((_, i) => (
          <li key={i} className={`h-[3px] flex-1 rounded-sm ${i <= step ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--border)_60%,transparent)]'}`} />
        ))}
      </ol>

      <p aria-live="polite" className="m-0 text-[.84rem] font-medium">
        {submitted || `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]!.title}`}
      </p>

      <div ref={hostRef} className="grid gap-2">
        {fields.map((key) => (
          <div key={key} data-key={key} className="sfs-f grid gap-1">
            <label className="text-[.7rem] text-text-dim" htmlFor={`sfs-${key}`}>{LABELS[key]}</label>
            <input
              id={`sfs-${key}`}
              name={key}
              type="text"
              value={values[key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              className="w-full min-w-0 rounded-[7px] border border-border bg-bg px-[9px] py-[7px] font-sans text-[.8rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button" disabled={step === 0} onClick={() => go(step - 1)}
          className="cursor-pointer rounded-[7px] border border-border bg-transparent px-[14px] py-[7px] font-sans text-[.78rem] text-text disabled:cursor-default disabled:opacity-45"
        >Back</button>
        <button
          type="button"
          onClick={() => {
            if (step < STEPS.length - 1) go(step + 1);
            else setSubmitted('Submitted — ' + Object.entries(values).filter(([, v]) => v).map(([k]) => LABELS[k]).join(', '));
          }}
          className="cursor-pointer rounded-[7px] border-0 bg-accent px-[14px] py-[7px] font-sans text-[.78rem] text-accent-fg"
        >{step === STEPS.length - 1 ? 'Submit' : 'Continue'}</button>
      </div>
    </form>
  );
}
