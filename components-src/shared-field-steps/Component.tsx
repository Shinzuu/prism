import { useLayoutEffect, useRef, useState } from 'react';

export type Step = { title: string; fields: string[] };

const DEFAULT_STEPS: Step[] = [
  { title: 'Who is travelling', fields: ['name', 'email'] },
  { title: 'Where to', fields: ['name', 'email', 'city', 'dates'] },
  { title: 'Confirm', fields: ['name', 'email', 'city'] },
];
const DEFAULT_LABELS: Record<string, string> = {
  name: 'Full name', email: 'Email', city: 'Destination city', dates: 'Travel dates',
};

export interface SharedFieldStepsProps {
  /** Steps in order; a field key listed in several steps is the same input carried across. Needs at least one step. */
  steps?: Step[];
  /** Visible label for each field key. */
  labels?: Record<string, string>;
  /** Text of the back button. */
  backLabel?: string;
  /** Text of the forward button on every step but the last. */
  continueLabel?: string;
  /** Text of the forward button on the last step. */
  submitLabel?: string;
  /** Status prefix shown after submitting, before the list of filled fields. */
  submittedPrefix?: string;
  /** Disables every input and both buttons. */
  disabled?: boolean;
  /** Fired when the step changes, with the new step index. */
  onStepChange?: (step: number) => void;
  /** Fired on submit from the last step, with every value typed so far. */
  onSubmit?: (values: Record<string, string>) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function SharedFieldSteps({
  steps: STEPS = DEFAULT_STEPS,
  labels: LABELS = DEFAULT_LABELS,
  backLabel = 'Back',
  continueLabel = 'Continue',
  submitLabel = 'Submit',
  submittedPrefix = 'Submitted — ',
  disabled = false,
  onStepChange,
  onSubmit,
  className = '',
}: SharedFieldStepsProps) {
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
    onStepChange?.(to);
  };

  const fields = STEPS[step]!.fields;

  return (
    <form className={`grid gap-[10px] ${className}`} onSubmit={(e) => e.preventDefault()} noValidate>
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
              disabled={disabled}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              className="w-full min-w-0 rounded-[7px] border border-border bg-bg px-[9px] py-[7px] font-sans text-[.8rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button" disabled={disabled || step === 0} onClick={() => go(step - 1)}
          className="cursor-pointer rounded-[7px] border border-border bg-transparent px-[14px] py-[7px] font-sans text-[.78rem] text-text enabled:hover:border-accent enabled:active:opacity-80 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-45"
        >{backLabel}</button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (step < STEPS.length - 1) go(step + 1);
            else {
              setSubmitted(submittedPrefix + Object.entries(values).filter(([, v]) => v).map(([k]) => LABELS[k]).join(', '));
              onSubmit?.(values);
            }
          }}
          className="cursor-pointer rounded-[7px] border-0 bg-accent px-[14px] py-[7px] font-sans text-[.78rem] text-accent-fg enabled:hover:opacity-90 enabled:active:opacity-80 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >{step === STEPS.length - 1 ? submitLabel : continueLabel}</button>
      </div>
    </form>
  );
}
