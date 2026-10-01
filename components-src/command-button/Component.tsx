import { useEffect, useRef, useState } from 'react';

/* CommandEvent has no React type yet, and the invoker attributes are not in
   React's JSX intrinsics, so both are declared rather than cast away. React 19
   already types `popover`, so redeclaring it would conflict. */
interface CommandEventLike extends Event { command: string }
declare module 'react' {
  interface ButtonHTMLAttributes<T> { command?: string; commandFor?: string }
}

export interface CommandButtonProps {
  /** Prefix for the target ids (`-sheet`, `-tip`, `-log`), so several instances can share a page. */
  idPrefix?: string;
  /** Label of the button that opens the dialog. */
  dialogButtonLabel?: string;
  /** Label of the button that toggles the popover. */
  popoverButtonLabel?: string;
  /** Label of the button that sends the custom --clear command to the log. */
  clearButtonLabel?: string;
  /** Label of the button that closes the dialog. */
  closeLabel?: string;
  /** Dialog heading. */
  dialogTitle?: string;
  /** Dialog body text. */
  dialogBody?: string;
  /** Popover heading. */
  popoverTitle?: string;
  /** Popover body text. */
  popoverBody?: string;
  /** First line in the log before any command runs. */
  initialLogMessage?: string;
  /** Log line after --clear. */
  clearedMessage?: string;
  /** Lines the log keeps. */
  logLimit?: number;
  /** Disables the three invoker buttons; a disabled invoker sends no command. */
  disabled?: boolean;
  /** Fired for every command that reaches a target, with the command and the target id. */
  onCommand?: (command: string, targetId: string) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function CommandButton({
  idPrefix = 'cb',
  dialogButtonLabel = 'Review changes',
  popoverButtonLabel = 'Shortcuts',
  clearButtonLabel = 'Clear log',
  closeLabel = 'Close',
  dialogTitle = 'Review changes',
  dialogBody = 'Esc closes this, focus returns to the button that opened it, and the page behind is inert — '
    + 'none of which is wired up by hand.',
  popoverTitle = 'Every button here is declarative',
  popoverBody = 'The dialog and this popover open with no script attached to them at all.',
  initialLogMessage = 'waiting — every button above is declarative',
  clearedMessage = 'cleared by --clear, dispatched to the target',
  logLimit = 3,
  disabled = false,
  onCommand,
  className = '',
}: CommandButtonProps) {
  const [lines, setLines] = useState<string[]>([initialLogMessage]);
  const logRef = useRef<HTMLOutputElement>(null);
  // Read through a ref so a new callback each render doesn't re-bind the listeners.
  const onCommandRef = useRef(onCommand);
  useEffect(() => { onCommandRef.current = onCommand; });

  const sheetId = `${idPrefix}-sheet`, tipId = `${idPrefix}-tip`, logId = `${idPrefix}-log`;

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;

    /* CommandEvent is dispatched at the TARGET, not the button — which is why
       one listener here serves every invoker pointing at this element,
       including markup added long after the listener was attached. */
    const onLog = (e: Event) => {
      const { command } = e as CommandEventLike;
      if (command === '--clear') {
        setLines([clearedMessage]);
      }
      onCommandRef.current?.(command, logId);
    };
    log.addEventListener('command', onLog);

    const targets = [sheetId, tipId]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const onTarget = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      const { command } = e as CommandEventLike;
      setLines((prev) => [`${command} → #${el.id}`, ...prev].slice(0, logLimit));
      onCommandRef.current?.(command, el.id);
    };
    for (const el of targets) el.addEventListener('command', onTarget);

    return () => {
      log.removeEventListener('command', onLog);
      for (const el of targets) el.removeEventListener('command', onTarget);
    };
  }, [sheetId, tipId, logId, clearedMessage, logLimit]);

  const btn =
    'cursor-pointer rounded-lg border border-transparent bg-accent px-[14px] py-2 font-sans text-[.8rem] ' +
    'text-accent-fg transition-[filter] duration-150 hover:brightness-[1.08] active:brightness-95 motion-reduce:transition-none ' +
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:brightness-100 ' +
    'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2';
  const ghost = 'border-border bg-transparent text-text';

  return (
    <div className={`grid gap-3 ${className}`}>
      {/* No onClick anywhere. Each button names its target and its verb; the
          browser wires focus return, Esc and inertness. */}
      <div className="flex flex-wrap gap-2">
        <button className={btn} commandFor={sheetId} command="show-modal" disabled={disabled}>{dialogButtonLabel}</button>
        <button className={`${btn} ${ghost}`} commandFor={tipId} command="toggle-popover" disabled={disabled}>{popoverButtonLabel}</button>
        <button className={`${btn} ${ghost}`} commandFor={logId} command="--clear" disabled={disabled}>{clearButtonLabel}</button>
      </div>

      <div
        id={tipId}
        popover=""
        className="fixed inset-auto bottom-[18%] m-auto max-w-[19rem] rounded-[10px] border border-border bg-raised px-[14px] py-3 text-text"
      >
        <p className="m-0 mb-1 text-[.78rem] font-medium">{popoverTitle}</p>
        <p className="m-0 text-[.74rem] text-text-dim">
          {popoverBody}
        </p>
      </div>

      <dialog id={sheetId} className="cb-sheet max-w-[21rem] rounded-xl border border-border bg-raised p-4 text-text">
        <p className="m-0 mb-[6px] text-[.86rem] font-medium">{dialogTitle}</p>
        <p className="m-0 mb-[14px] text-[.76rem] leading-relaxed text-text-dim">
          {dialogBody}
        </p>
        <button className={btn} commandFor={sheetId} command="close">{closeLabel}</button>
      </dialog>

      <output
        id={logId}
        ref={logRef}
        aria-live="polite"
        className="block min-h-[2.6rem] whitespace-pre-line rounded-lg border border-dashed border-border px-[10px] py-2 font-mono text-[.68rem] text-text-dim"
      >
        {lines.join('\n')}
      </output>
    </div>
  );
}
