import { useRef, useState } from 'react';

export type HistoryEntry = { text: string; label: string; at: number };
const rel = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const ago = (t: number) => {
  const mins = Math.round((t - Date.now()) / 60000);
  return Math.abs(mins) < 60 ? rel.format(mins, 'minute') : rel.format(Math.round(mins / 60), 'hour');
};

/* A factory, not a constant: the demo timestamps are relative to when the
   component mounts, so "42 minutes ago" stays true however long the page sat. */
const DEFAULT_ENTRIES = (): HistoryEntry[] => [
  { text: 'Sweep schedule: manual only.', label: 'created', at: Date.now() - 1000 * 60 * 42 },
  { text: 'Sweep schedule: manual, with automatic above Mach 0.7.', label: 'added automatic mode', at: Date.now() - 1000 * 60 * 28 },
  { text: 'Sweep schedule: automatic above Mach 0.7, manual override retained.', label: 'reworded', at: Date.now() - 1000 * 60 * 11 },
];

export interface HistoryScrubberProps {
  /** Initial versions, oldest first; must hold at least one. `at` is a ms timestamp. */
  entries?: readonly HistoryEntry[];
  /** Accessible name for the timeline slider. */
  sliderLabel?: string;
  /** Accessible name for the edit field. */
  inputLabel?: string;
  /** Edit-field placeholder on the latest version. */
  placeholder?: string;
  /** Edit-field placeholder while previewing an older version. */
  lockedPlaceholder?: string;
  /** Text on the restore button. */
  restoreLabel?: string;
  /** Label given to versions typed into the edit field. */
  editLabel?: string;
  /** Disables the slider, the restore button and the edit field. */
  disabled?: boolean;
  /** Fires after an older version is restored, with that version and how many later ones were dropped. */
  onRestore?: (entry: HistoryEntry, discarded: number) => void;
  /** Fires when a new version is added from the edit field. */
  onCommit?: (entry: HistoryEntry) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

/* Undo as a timeline you drag through rather than a key you press repeatedly.
   Scrubbing is a PREVIEW; nothing is committed until you restore. */
export default function HistoryScrubber({
  entries,
  sliderLabel = 'History position',
  inputLabel = 'Make a change',
  placeholder = 'Type a change and press Enter',
  lockedPlaceholder = 'Restore this version to edit from here',
  restoreLabel = 'Restore this version',
  editLabel = 'edited',
  disabled = false,
  onRestore,
  onCommit,
  className = '',
}: HistoryScrubberProps) {
  const seed = useRef<HistoryEntry[]>(entries ? [...entries] : DEFAULT_ENTRIES());
  const [history, setHistory] = useState<HistoryEntry[]>(seed.current);
  const [at, setAt] = useState(seed.current.length - 1);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');

  const entry = history[at]!;
  const past = at < history.length - 1;

  const restore = () => {
    if (disabled) return;
    // Restoring TRUNCATES the future rather than branching: one timeline, and
    // the discarded versions are named before they go.
    const dropped = history.length - 1 - at;
    setHistory((h) => h.slice(0, at + 1));
    setStatus(`Restored. ${dropped} later version${dropped === 1 ? '' : 's'} discarded.`);
    onRestore?.(entry, dropped);
  };

  return (
    <div className={`grid max-w-[460px] gap-[11px] ${className}`}>
      <div className={`min-h-[76px] rounded-[10px] border px-[15px] py-[13px] ${
        past ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))]' : 'border-border bg-surface'
      }`}>
        <p className="m-0 text-[.88rem] leading-relaxed">{entry.text}</p>
      </div>

      <div className="grid gap-2">
        <input
          type="range" min={0} max={history.length - 1} value={at}
          aria-label={sliderLabel}
          disabled={disabled}
          onChange={(e) => setAt(Number(e.target.value))}
          onMouseUp={() => setStatus(`Version ${at + 1} of ${history.length}: ${entry.label}`)}
          className="w-full accent-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex items-baseline gap-[10px] text-[.76rem] text-text-dim">
          <span>{ago(entry.at)}</span>
          <span className="flex-1">{entry.label}</span>
          {past && (
            <button type="button" onClick={restore} disabled={disabled}
              className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[.72rem] text-accent underline underline-offset-[3px]
                         hover:text-text active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
                         disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-accent disabled:active:translate-y-0">
              {restoreLabel}
            </button>
          )}
        </div>
      </div>

      <input
        value={draft}
        // Editing the past would silently discard the future; block it and say so.
        disabled={past || disabled}
        placeholder={past ? lockedPlaceholder : placeholder}
        aria-label={inputLabel}
        autoComplete="off"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || !draft.trim()) return;
          const added: HistoryEntry = { text: draft.trim(), label: editLabel, at: Date.now() };
          const next = [...history, added];
          setHistory(next);
          onCommit?.(added);
          setAt(next.length - 1);
          setDraft('');
        }}
        className="w-full rounded-lg border border-border bg-bg px-3 py-[9px] font-sans text-[.86rem] text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />

      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
