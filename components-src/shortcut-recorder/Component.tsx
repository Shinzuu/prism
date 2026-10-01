import { useEffect, useRef, useState } from 'react';

const DEFAULT_TAKEN: Record<string, string> = {
  'Ctrl+W': 'Close tab', 'Ctrl+T': 'New tab', 'Ctrl+N': 'New window',
  'Ctrl+Shift+Q': 'Quit', 'Ctrl+P': 'Print', 'Ctrl+S': 'Save page',
  'Meta+Q': 'Quit', 'Ctrl+F': 'Find in page',
};
const PRETTY: Record<string, string> = {
  Control: 'Ctrl', Meta: 'Meta', Alt: 'Alt', Shift: 'Shift', ' ': 'Space',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc',
};

type Combo = { partial: string } | { combo: string; label: string };

function read(e: KeyboardEvent): Combo {
  const mods: string[] = [];
  if (e.ctrlKey) mods.push('Ctrl');
  if (e.metaKey) mods.push('Meta');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');
  // A modifier alone is not a binding; keep listening rather than accepting it.
  if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return { partial: mods.join(' + ') };
  const name = PRETTY[e.key] ?? (e.key.length === 1 ? e.key.toUpperCase() : e.key);
  return { combo: [...mods, name].join('+'), label: [...mods, name].join(' + ') };
}

const defaultConflictMessage = (combo: string, clash: string) =>
  `${combo} is already ${clash} in the browser. Pick another.`;

export interface ShortcutRecorderProps {
  /** Binding shown before the user records one, written with ' + ' between keys. */
  defaultValue?: string;
  /** Combinations that are refused, keyed like 'Ctrl+Shift+Q', valued with what they already do. */
  taken?: Record<string, string>;
  /** Name of the action being bound, shown in the label. */
  actionName?: string;
  /** Text shown in place of a binding once it has been cleared. */
  emptyLabel?: string;
  /** Placeholder shown while listening for keys. */
  listeningText?: string;
  /** Hint under the button while idle. */
  idleHint?: string;
  /** Hint under the button while listening. */
  listeningHint?: string;
  /** Builds the message shown when a combination is already taken. */
  conflictMessage?: (combo: string, takenBy: string) => string;
  /** Prefix for the element ids, so several recorders can share a page. */
  idPrefix?: string;
  /** Disables recording. */
  disabled?: boolean;
  /** Fired when a new binding is accepted, or with emptyLabel when it is cleared. */
  onChange?: (binding: string) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function ShortcutRecorder({
  defaultValue = 'Ctrl + K',
  taken: TAKEN = DEFAULT_TAKEN,
  actionName = 'Open command palette',
  emptyLabel = 'None',
  listeningText = 'Press keys…',
  idleHint = 'Click, then press the combination you want.',
  listeningHint = 'Listening. Escape cancels, Backspace clears.',
  conflictMessage = defaultConflictMessage,
  idPrefix = 'sr',
  disabled = false,
  onChange,
  className = '',
}: ShortcutRecorderProps) {
  const [current, setCurrent] = useState(defaultValue);
  const [display, setDisplay] = useState(defaultValue);
  const [listening, setListening] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!listening || disabled) return;

    const onKey = (e: KeyboardEvent) => {
      // Capture phase, so the combination is seen before anything else reacts.
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') { setDisplay(currentRef.current); setListening(false); return; }
      if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setCurrent(emptyLabel); setDisplay(emptyLabel); setListening(false);
        onChangeRef.current?.(emptyLabel);
        return;
      }

      const c = read(e);
      if ('partial' in c) { setDisplay(`${c.partial} …`); return; }

      const clash = TAKEN[c.combo];
      if (clash) {
        // Name the binding it would break rather than refusing silently.
        setConflict(conflictMessage(c.label, clash));
        setDisplay(listeningText);
        return;
      }

      setCurrent(c.label);
      setDisplay(c.label);
      setConflict(null);
      setListening(false);
      onChangeRef.current?.(c.label);
    };

    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [listening, disabled, TAKEN, emptyLabel, listeningText, conflictMessage]);

  const start = () => {
    if (disabled) return;
    setListening(true);
    setDisplay(listeningText);
    setConflict(null);
  };

  return (
    <div className={`grid max-w-[360px] gap-[6px] ${className}`}>
      <label className="text-[.84rem] font-medium" htmlFor={`${idPrefix}-btn`}>
        Binding for “{actionName}”
      </label>
      <button
        id={`${idPrefix}-btn`}
        type="button"
        aria-describedby={`${idPrefix}-note`}
        disabled={disabled}
        onClick={() => (listening ? setListening(false) : start())}
        onBlur={() => setListening(false)}
        className={`cursor-pointer rounded-[9px] border px-[14px] py-[11px] text-left font-mono text-[.88rem] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px] active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 ${
          listening
            ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_8%,var(--bg))] text-text-dim'
            : 'border-border bg-bg text-text enabled:hover:border-accent'
        }`}
      >
        <span>{display}</span>
      </button>
      <p className="m-0 text-[.74rem] text-text-dim" id={`${idPrefix}-note`}>
        {listening ? listeningHint : idleHint}
      </p>
      {conflict && <p className="m-0 text-[.76rem] text-accent">{conflict}</p>}
    </div>
  );
}
