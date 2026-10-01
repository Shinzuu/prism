import { useEffect, useRef, useState } from 'react';

/* The sheet reads the PAGE rather than a list somebody maintains. Every entry
   registers itself, so a binding cannot exist without appearing here and the
   sheet cannot document one that was removed. */
export type ShortcutEntry = { keys: string; label: string; group: string };

const DEFAULT_REGISTRY: ShortcutEntry[] = [
  { keys: 'g d', label: 'Dashboard', group: 'Go' },
  { keys: 'g s', label: 'Settings', group: 'Go' },
  { keys: 'n', label: 'New record', group: 'Create' },
  { keys: 'd', label: 'Duplicate', group: 'Create' },
  { keys: '/', label: 'Search', group: 'Find' },
  { keys: 'shift+?', label: 'This sheet', group: 'Help' },
];

export interface ShortcutSheetProps {
  /** Every binding on the page; keys are space-separated for sequences, '+' for chords. */
  registry?: ShortcutEntry[];
  /** Key that opens the sheet. */
  openKey?: string;
  /** How long a partial sequence like "g" waits for its next key, in ms. */
  sequenceTimeout?: number;
  /** Sentence after the "Press ? for the shortcut sheet." prompt. */
  hint?: string;
  /** Heading of the sheet. */
  title?: string;
  /** Footer note in the sheet, before the Esc hint. */
  footer?: string;
  /** Turns every binding and button off, including the key that opens the sheet. */
  disabled?: boolean;
  /** Fired when a binding runs, by key or by button. */
  onTrigger?: (entry: ShortcutEntry) => void;
  /** Fired when the sheet opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function ShortcutSheet({
  registry: REGISTRY = DEFAULT_REGISTRY,
  openKey = '?',
  sequenceTimeout = 900,
  hint = 'These are registered, not written down.',
  title = 'Keyboard',
  footer = 'Read from the handlers on this page.',
  disabled = false,
  onTrigger,
  onOpenChange,
  className = '',
}: ShortcutSheetProps) {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const last = useRef<Element | null>(null);
  const buffer = useRef('');
  const bufferTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const fire = (entry: ShortcutEntry) => {
    setLog(`${entry.label} · ${entry.keys}`);
    onTriggerRef.current?.(entry);
  };
  const show = (next: boolean) => {
    setOpen(next);
    onOpenChangeRef.current?.(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) return;

      if (open) {
        if (e.key === 'Escape') { e.preventDefault(); show(false); }
        else if (e.key === 'Tab') { e.preventDefault(); sheetRef.current?.focus(); }
        return;
      }
      if (disabled) return;
      if (e.key === openKey) { e.preventDefault(); last.current = document.activeElement; show(true); return; }

      // Sequences: a short buffer so "g" then "d" resolves as one binding.
      buffer.current = `${buffer.current} ${e.key}`.trim();
      if (bufferTimer.current) clearTimeout(bufferTimer.current);
      bufferTimer.current = setTimeout(() => { buffer.current = ''; }, sequenceTimeout);

      const exact = REGISTRY.find((r) => r.keys === buffer.current || r.keys === e.key);
      if (exact) { e.preventDefault(); fire(exact); buffer.current = ''; return; }
      if (!REGISTRY.some((r) => r.keys.startsWith(`${buffer.current} `))) buffer.current = '';
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, disabled, REGISTRY, openKey, sequenceTimeout]);

  useEffect(() => {
    if (open) sheetRef.current?.focus({ preventScroll: true });
    else if (last.current instanceof HTMLElement && last.current.isConnected) last.current.focus();
  }, [open]);

  const groups = [...new Set(REGISTRY.map((r) => r.group))];

  return (
    <div className={`relative grid gap-3 ${className}`}>
      <p className="m-0 text-[.86rem] text-text-dim">
        Press <kbd className="ks-kbd">{openKey}</kbd> for the shortcut sheet. {hint}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {REGISTRY.map((r) => (
          <button key={r.keys} type="button" disabled={disabled} onClick={() => fire(r)}
            className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1.5 font-sans text-[.8rem] text-text enabled:hover:border-accent active:opacity-80 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            {r.label}
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" className="m-0 min-h-[1.2em] text-[.8rem] text-accent">{log}</p>

      {open && (
        <>
          <div onClick={() => show(false)}
               className="fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--text)_32%,transparent)]" />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ks-title"
            tabIndex={-1}
            className="ks-sheet fixed left-1/2 top-1/2 z-50 max-h-[76vh] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-border bg-bg px-[22px] py-5 text-text"
          >
            <h3 id="ks-title" className="m-0 mb-[14px] text-[1.05rem]">{title}</h3>
            <div className="grid gap-4">
              {groups.map((g) => (
                <div key={g}>
                  <h4 className="m-0 mb-1.5 text-[.74rem] font-medium text-text-dim">{g}</h4>
                  {REGISTRY.filter((r) => r.group === g).map((r) => (
                    <div key={r.keys} className="flex items-baseline gap-[10px] border-t border-border py-[5px]">
                      <span className="flex-1 text-[.86rem]">{r.label}</span>
                      <span className="flex gap-[3px]">
                        {r.keys.split(/[ +]/).map((k, i) => <kbd key={i} className="ks-kbd">{k}</kbd>)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="m-0 mt-4 border-t border-border pt-2.5 text-[.76rem] text-text-dim">
              {footer} <kbd className="ks-kbd">Esc</kbd> to close.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
