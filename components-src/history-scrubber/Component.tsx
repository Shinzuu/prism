import { useRef, useState } from 'react';

type Entry = { text: string; label: string; at: number };
const rel = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const ago = (t: number) => {
  const mins = Math.round((t - Date.now()) / 60000);
  return Math.abs(mins) < 60 ? rel.format(mins, 'minute') : rel.format(Math.round(mins / 60), 'hour');
};

/* Undo as a timeline you drag through rather than a key you press repeatedly.
   Scrubbing is a PREVIEW; nothing is committed until you restore. */
export default function HistoryScrubber() {
  const seed = useRef<Entry[]>([
    { text: 'Sweep schedule: manual only.', label: 'created', at: Date.now() - 1000 * 60 * 42 },
    { text: 'Sweep schedule: manual, with automatic above Mach 0.7.', label: 'added automatic mode', at: Date.now() - 1000 * 60 * 28 },
    { text: 'Sweep schedule: automatic above Mach 0.7, manual override retained.', label: 'reworded', at: Date.now() - 1000 * 60 * 11 },
  ]);
  const [history, setHistory] = useState<Entry[]>(seed.current);
  const [at, setAt] = useState(seed.current.length - 1);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');

  const entry = history[at]!;
  const past = at < history.length - 1;

  const restore = () => {
    // Restoring TRUNCATES the future rather than branching: one timeline, and
    // the discarded versions are named before they go.
    const dropped = history.length - 1 - at;
    setHistory((h) => h.slice(0, at + 1));
    setStatus(`Restored. ${dropped} later version${dropped === 1 ? '' : 's'} discarded.`);
  };

  return (
    <div className="grid max-w-[460px] gap-[11px]">
      <div className={`min-h-[76px] rounded-[10px] border px-[15px] py-[13px] ${
        past ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))]' : 'border-border bg-surface'
      }`}>
        <p className="m-0 text-[.88rem] leading-relaxed">{entry.text}</p>
      </div>

      <div className="grid gap-2">
        <input
          type="range" min={0} max={history.length - 1} value={at}
          aria-label="History position"
          onChange={(e) => setAt(Number(e.target.value))}
          onMouseUp={() => setStatus(`Version ${at + 1} of ${history.length}: ${entry.label}`)}
          className="w-full accent-accent"
        />
        <div className="flex items-baseline gap-[10px] text-[.76rem] text-text-dim">
          <span>{ago(entry.at)}</span>
          <span className="flex-1">{entry.label}</span>
          {past && (
            <button type="button" onClick={restore}
              className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[.72rem] text-accent underline underline-offset-[3px]">
              Restore this version
            </button>
          )}
        </div>
      </div>

      <input
        value={draft}
        // Editing the past would silently discard the future; block it and say so.
        disabled={past}
        placeholder={past ? 'Restore this version to edit from here' : 'Type a change and press Enter'}
        aria-label="Make a change"
        autoComplete="off"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || !draft.trim()) return;
          const next = [...history, { text: draft.trim(), label: 'edited', at: Date.now() }];
          setHistory(next);
          setAt(next.length - 1);
          setDraft('');
        }}
        className="w-full rounded-lg border border-border bg-bg px-3 py-[9px] font-sans text-[.86rem] text-text focus:border-accent focus:outline-none disabled:opacity-50"
      />

      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
