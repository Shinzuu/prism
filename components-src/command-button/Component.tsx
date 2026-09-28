import { useEffect, useRef, useState } from 'react';

/* CommandEvent has no React type yet, and the invoker attributes are not in
   React's JSX intrinsics, so both are declared rather than cast away. React 19
   already types `popover`, so redeclaring it would conflict. */
interface CommandEventLike extends Event { command: string }
declare module 'react' {
  interface ButtonHTMLAttributes<T> { command?: string; commandFor?: string }
}

export default function CommandButton() {
  const [lines, setLines] = useState<string[]>(['waiting — every button above is declarative']);
  const logRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;

    /* CommandEvent is dispatched at the TARGET, not the button — which is why
       one listener here serves every invoker pointing at this element,
       including markup added long after the listener was attached. */
    const onLog = (e: Event) => {
      if ((e as CommandEventLike).command === '--clear') {
        setLines(['cleared by --clear, dispatched to the target']);
      }
    };
    log.addEventListener('command', onLog);

    const targets = ['cb-sheet', 'cb-tip']
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const onTarget = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      setLines((prev) => [`${(e as CommandEventLike).command} → #${el.id}`, ...prev].slice(0, 3));
    };
    for (const el of targets) el.addEventListener('command', onTarget);

    return () => {
      log.removeEventListener('command', onLog);
      for (const el of targets) el.removeEventListener('command', onTarget);
    };
  }, []);

  const btn =
    'cursor-pointer rounded-lg border border-transparent bg-accent px-[14px] py-2 font-sans text-[.8rem] ' +
    'text-accent-fg transition-[filter] duration-150 hover:brightness-[1.08] motion-reduce:transition-none ' +
    'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2';
  const ghost = 'border-border bg-transparent text-text';

  return (
    <div className="grid gap-3">
      {/* No onClick anywhere. Each button names its target and its verb; the
          browser wires focus return, Esc and inertness. */}
      <div className="flex flex-wrap gap-2">
        <button className={btn} commandFor="cb-sheet" command="show-modal">Review changes</button>
        <button className={`${btn} ${ghost}`} commandFor="cb-tip" command="toggle-popover">Shortcuts</button>
        <button className={`${btn} ${ghost}`} commandFor="cb-log" command="--clear">Clear log</button>
      </div>

      <div
        id="cb-tip"
        popover=""
        className="fixed inset-auto bottom-[18%] m-auto max-w-[19rem] rounded-[10px] border border-border bg-raised px-[14px] py-3 text-text"
      >
        <p className="m-0 mb-1 text-[.78rem] font-medium">Every button here is declarative</p>
        <p className="m-0 text-[.74rem] text-text-dim">
          The dialog and this popover open with no script attached to them at all.
        </p>
      </div>

      <dialog id="cb-sheet" className="cb-sheet max-w-[21rem] rounded-xl border border-border bg-raised p-4 text-text">
        <p className="m-0 mb-[6px] text-[.86rem] font-medium">Review changes</p>
        <p className="m-0 mb-[14px] text-[.76rem] leading-relaxed text-text-dim">
          Esc closes this, focus returns to the button that opened it, and the page behind is inert —
          none of which is wired up by hand.
        </p>
        <button className={btn} commandFor="cb-sheet" command="close">Close</button>
      </dialog>

      <output
        id="cb-log"
        ref={logRef}
        aria-live="polite"
        className="block min-h-[2.6rem] whitespace-pre-line rounded-lg border border-dashed border-border px-[10px] py-2 font-mono text-[.68rem] text-text-dim"
      >
        {lines.join('\n')}
      </output>
    </div>
  );
}
