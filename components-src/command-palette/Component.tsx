import { useEffect, useRef, useState } from 'react';

/** hint is the shortcut shown beside the label; leave it empty for none. */
export type Command = { label: string; hint?: string };

export type PaletteLabels = { navigate: string; run: string; close: string };

const DEFAULT_LABELS: PaletteLabels = { navigate: 'navigate', run: 'run', close: 'close' };

const DEFAULT_COMMANDS: Command[] = [
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

export interface CommandPaletteProps {
  /** Commands to search, in display order. */
  commands?: Command[];
  /** Letter that opens the palette with Ctrl or Cmd. */
  hotkey?: string;
  /** Text on the trigger button. */
  triggerLabel?: string;
  /** Shortcut shown on the trigger button. */
  shortcutLabel?: string;
  /** Placeholder in the search field. */
  placeholder?: string;
  /** Text when nothing matches. */
  emptyText?: string;
  /** Accessible name of the dialog. */
  dialogLabel?: string;
  /** Accessible name of the command list. */
  listLabel?: string;
  /** Footer key hints; any key left out keeps its default. */
  labels?: Partial<PaletteLabels>;
  /** Prefix for element ids, so several instances can share a page. */
  idPrefix?: string;
  /** Disables the trigger button and the hotkey. */
  disabled?: boolean;
  /** Fired when a command is run, by Enter or click. */
  onSelect?: (command: Command) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function CommandPalette({
  commands = DEFAULT_COMMANDS,
  hotkey = 'k',
  triggerLabel = 'Search commands',
  shortcutLabel = 'Ctrl K',
  placeholder = 'Type a command…',
  emptyText = 'No matching command',
  dialogLabel = 'Command palette',
  listLabel = 'Commands',
  labels,
  idPrefix = 'cp',
  disabled = false,
  onSelect,
  className = '',
}: CommandPaletteProps) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const last = useRef<Element | null>(null);

  const matches = commands.map((c) => ({ ...c, cmd: c, ...score(query, c.label) })).filter((c) => c.hit);
  const at = Math.min(active, Math.max(0, matches.length - 1));

  // The keydown listener only re-binds on open/length changes, so it runs the
  // current selection through a ref rather than a stale closure.
  const runActive = useRef<() => void>(() => {});
  useEffect(() => {
    runActive.current = () => { const m = matches[at]; if (m) onSelect?.(m.cmd); };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === hotkey.toLowerCase()) {
        if (disabled && !open) return;
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
      else if (e.key === 'Enter') { e.preventDefault(); runActive.current(); setOpen(false); }
      else if (e.key === 'Tab') { e.preventDefault(); inputRef.current?.focus(); }  // trap
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, matches.length, hotkey, disabled]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (last.current instanceof HTMLElement && last.current.isConnected) last.current.focus();
  }, [open]);

  useEffect(() => { listRef.current?.children[at]?.scrollIntoView({ block: 'nearest' }); }, [at]);

  const kbd = 'rounded-[5px] border border-border bg-raised px-1.5 py-1 font-mono text-[11px] leading-none text-text-dim';

  return (
    <div className={className || undefined}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { last.current = document.activeElement; setOpen(true); setQuery(''); setActive(0); }}
        className="inline-flex min-w-[260px] cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-border bg-surface px-[14px] py-2.5 font-sans text-text-dim transition-colors hover:border-accent hover:text-text active:bg-raised motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-text-dim disabled:active:bg-surface focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <span className="flex-1 text-left">{triggerLabel}</span>
        <kbd className={kbd}>{shortcutLabel}</kbd>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)}
               className="cp-scrim fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--text)_38%,transparent)]" />
          <div role="dialog" aria-modal="true" aria-labelledby={`${idPrefix}-label`}
               className="cp-panel fixed left-1/2 top-[14vh] z-50 w-[min(520px,calc(100vw-28px))] -translate-x-1/2 overflow-hidden rounded-[var(--radius)] border border-border bg-bg">
            <label id={`${idPrefix}-label`} className="sr-only" htmlFor={`${idPrefix}-input`}>{dialogLabel}</label>
            <input
              id={`${idPrefix}-input`}
              ref={inputRef}
              type="text"
              role="combobox"
              autoComplete="off"
              aria-expanded
              aria-controls={`${idPrefix}-list`}
              aria-activedescendant={matches.length ? `${idPrefix}-opt-${at}` : ''}
              placeholder={placeholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              className="w-full border-0 border-b border-border bg-transparent px-4 py-3.5 font-sans text-[.95rem] text-text focus:outline-none"
            />
            <ul id={`${idPrefix}-list`} ref={listRef} role="listbox" aria-label={listLabel}
                className="m-0 max-h-[260px] list-none overflow-y-auto p-1.5">
              {matches.map((m, i) => (
                <li
                  key={m.label}
                  id={`${idPrefix}-opt-${i}`}
                  role="option"
                  aria-selected={i === at}
                  onClick={() => { onSelect?.(m.cmd); setOpen(false); }}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-[.88rem] ${
                    i === at ? 'bg-raised text-text' : 'text-text-dim hover:bg-raised hover:text-text'
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
            {!matches.length && <p className="m-0 px-4 py-3 text-[.86rem] text-text-dim">{emptyText}</p>}
            <div className="flex gap-4 border-t border-border px-[14px] py-2.5 text-[12px] text-text-dim">
              <span className="inline-flex items-center gap-1.5"><kbd className={kbd}>↑</kbd><kbd className={kbd}>↓</kbd> {L.navigate}</span>
              <span className="inline-flex items-center gap-1.5"><kbd className={kbd}>Enter</kbd> {L.run}</span>
              <span className="inline-flex items-center gap-1.5"><kbd className={kbd}>Esc</kbd> {L.close}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
