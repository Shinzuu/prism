import { useEffect, useRef, useState } from 'react';

const COMMANDS = [
  { label: 'New file', hint: 'Ctrl N' },
  { label: 'Open recent', hint: 'Ctrl R' },
  { label: 'Search in project', hint: 'Ctrl Shift F' },
  { label: 'Toggle dark mode', hint: 'Ctrl D' },
  { label: 'Go to definition', hint: 'F12' },
  { label: 'Format document', hint: 'Alt Shift F' },
  { label: 'Split editor right', hint: 'Ctrl \\' },
  { label: 'Close all tabs', hint: '' },
];

type Part = string | { m: string };

/* Subsequence match, so "gtd" finds "Go to definition". */
function score(query: string, label: string): { hit: boolean; parts?: Part[] } {
  if (!query) return { hit: true, parts: [label] };
  const q = query.toLowerCase(), l = label.toLowerCase();
  const parts: Part[] = [];
  let qi = 0, from = 0;
  for (let i = 0; i < l.length && qi < q.length; i++) {
    if (l[i] === q[qi]) { parts.push(label.slice(from, i), { m: label[i]! }); from = i + 1; qi++; }
  }
  if (qi < q.length) return { hit: false };
  parts.push(label.slice(from));
  return { hit: true, parts };
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const last = useRef<Element | null>(null);

  const matches = COMMANDS.map((c) => ({ ...c, ...score(query, c.label) })).filter((c) => c.hit);
  const at = Math.min(active, Math.max(0, matches.length - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!open) last.current = document.activeElement;
        setOpen((v) => !v);
        setQuery(''); setActive(0);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1 + matches.length) % Math.max(1, matches.length)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + matches.length) % Math.max(1, matches.length)); }
      else if (e.key === 'Enter') { e.preventDefault(); setOpen(false); }
      else if (e.key === 'Tab') { e.preventDefault(); inputRef.current?.focus(); }  // trap
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, matches.length]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (last.current instanceof HTMLElement && last.current.isConnected) last.current.focus();
  }, [open]);

  useEffect(() => { listRef.current?.children[at]?.scrollIntoView({ block: 'nearest' }); }, [at]);

  const kbd = 'rounded-[5px] border border-border bg-raised px-1.5 py-1 font-mono text-[11px] leading-none text-text-dim';

  return (
    <div>
      <button
        type="button"
        onClick={() => { last.current = document.activeElement; setOpen(true); setQuery(''); setActive(0); }}
        className="inline-flex min-w-[260px] cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-border bg-surface px-[14px] py-2.5 font-sans text-text-dim transition-colors hover:border-accent hover:text-text motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <span className="flex-1 text-left">Search commands</span>
        <kbd className={kbd}>Ctrl K</kbd>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)}
               className="cp-scrim fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--text)_38%,transparent)]" />
          <div role="dialog" aria-modal="true" aria-labelledby="cp-label"
               className="cp-panel fixed left-1/2 top-[14vh] z-50 w-[min(520px,calc(100vw-28px))] -translate-x-1/2 overflow-hidden rounded-[var(--radius)] border border-border bg-bg">
            <label id="cp-label" className="sr-only" htmlFor="cp-input">Command palette</label>
            <input
              id="cp-input"
              ref={inputRef}
              type="text"
              role="combobox"
              autoComplete="off"
              aria-expanded
              aria-controls="cp-list"
              aria-activedescendant={matches.length ? `cp-opt-${at}` : ''}
              placeholder="Type a command…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              className="w-full border-0 border-b border-border bg-transparent px-4 py-3.5 font-sans text-[.95rem] text-text focus:outline-none"
            />
            <ul id="cp-list" ref={listRef} role="listbox" aria-label="Commands"
                className="m-0 max-h-[260px] list-none overflow-y-auto p-1.5">
              {matches.map((m, i) => (
                <li
                  key={m.label}
                  id={`cp-opt-${i}`}
                  role="option"
                  aria-selected={i === at}
                  onClick={() => setOpen(false)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-[.88rem] ${
                    i === at ? 'bg-raised text-text' : 'text-text-dim'
                  }`}
                >
                  <span>
                    {m.parts?.map((p, n) => typeof p === 'string'
                      ? <span key={n}>{p}</span>
                      : <mark key={n} className="cp-mark">{p.m}</mark>)}
                  </span>
                  {m.hint && <span className="font-mono text-[11px] text-text-dim">{m.hint}</span>}
                </li>
              ))}
            </ul>
            {!matches.length && <p className="m-0 px-4 py-3 text-[.86rem] text-text-dim">No matching command</p>}
            <div className="flex gap-4 border-t border-border px-[14px] py-2.5 text-[12px] text-text-dim">
              <span className="inline-flex items-center gap-1.5"><kbd className={kbd}>↑</kbd><kbd className={kbd}>↓</kbd> navigate</span>
              <span className="inline-flex items-center gap-1.5"><kbd className={kbd}>Enter</kbd> run</span>
              <span className="inline-flex items-center gap-1.5"><kbd className={kbd}>Esc</kbd> close</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
