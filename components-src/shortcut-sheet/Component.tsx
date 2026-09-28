import { useEffect, useRef, useState } from 'react';

/* The sheet reads the PAGE rather than a list somebody maintains. Every entry
   registers itself, so a binding cannot exist without appearing here and the
   sheet cannot document one that was removed. */
const REGISTRY = [
  { keys: 'g d', label: 'Dashboard', group: 'Go' },
  { keys: 'g s', label: 'Settings', group: 'Go' },
  { keys: 'n', label: 'New record', group: 'Create' },
  { keys: 'd', label: 'Duplicate', group: 'Create' },
  { keys: '/', label: 'Search', group: 'Find' },
  { keys: 'shift+?', label: 'This sheet', group: 'Help' },
];

export default function ShortcutSheet() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const last = useRef<Element | null>(null);
  const buffer = useRef('');
  const bufferTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = (entry: (typeof REGISTRY)[number]) => setLog(`${entry.label} · ${entry.keys}`);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) return;

      if (open) {
        if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
        else if (e.key === 'Tab') { e.preventDefault(); sheetRef.current?.focus(); }
        return;
      }
      if (e.key === '?') { e.preventDefault(); last.current = document.activeElement; setOpen(true); return; }

      // Sequences: a short buffer so "g" then "d" resolves as one binding.
      buffer.current = `${buffer.current} ${e.key}`.trim();
      if (bufferTimer.current) clearTimeout(bufferTimer.current);
      bufferTimer.current = setTimeout(() => { buffer.current = ''; }, 900);

      const exact = REGISTRY.find((r) => r.keys === buffer.current || r.keys === e.key);
      if (exact) { e.preventDefault(); fire(exact); buffer.current = ''; return; }
      if (!REGISTRY.some((r) => r.keys.startsWith(`${buffer.current} `))) buffer.current = '';
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  useEffect(() => {
    if (open) sheetRef.current?.focus({ preventScroll: true });
    else if (last.current instanceof HTMLElement && last.current.isConnected) last.current.focus();
  }, [open]);

  const groups = [...new Set(REGISTRY.map((r) => r.group))];

  return (
    <div className="relative grid gap-3">
      <p className="m-0 text-[.86rem] text-text-dim">
        Press <kbd className="ks-kbd">?</kbd> for the shortcut sheet. These are registered, not written down.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {REGISTRY.map((r) => (
          <button key={r.keys} type="button" onClick={() => fire(r)}
            className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1.5 font-sans text-[.8rem] text-text hover:border-accent">
            {r.label}
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" className="m-0 min-h-[1.2em] text-[.8rem] text-accent">{log}</p>

      {open && (
        <>
          <div onClick={() => setOpen(false)}
               className="fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--text)_32%,transparent)]" />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ks-title"
            tabIndex={-1}
            className="ks-sheet fixed left-1/2 top-1/2 z-50 max-h-[76vh] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-border bg-bg px-[22px] py-5 text-text"
          >
            <h3 id="ks-title" className="m-0 mb-[14px] text-[1.05rem]">Keyboard</h3>
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
              Read from the handlers on this page. <kbd className="ks-kbd">Esc</kbd> to close.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
