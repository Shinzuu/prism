import { useEffect, useRef, useState } from 'react';

const TAKEN: Record<string, string> = {
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

export default function ShortcutRecorder() {
  const [current, setCurrent] = useState('Ctrl + K');
  const [display, setDisplay] = useState('Ctrl + K');
  const [listening, setListening] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (!listening) return;

    const onKey = (e: KeyboardEvent) => {
      // Capture phase, so the combination is seen before anything else reacts.
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') { setDisplay(currentRef.current); setListening(false); return; }
      if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setCurrent('None'); setDisplay('None'); setListening(false); return;
      }

      const c = read(e);
      if ('partial' in c) { setDisplay(`${c.partial} …`); return; }

      const clash = TAKEN[c.combo];
      if (clash) {
        // Name the binding it would break rather than refusing silently.
        setConflict(`${c.label} is already ${clash} in the browser. Pick another.`);
        setDisplay('Press keys…');
        return;
      }

      setCurrent(c.label);
      setDisplay(c.label);
      setConflict(null);
      setListening(false);
    };

    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [listening]);

  const start = () => {
    setListening(true);
    setDisplay('Press keys…');
    setConflict(null);
  };

  return (
    <div className="grid max-w-[360px] gap-[6px]">
      <label className="text-[.84rem] font-medium" htmlFor="sr-btn">
        Binding for “Open command palette”
      </label>
      <button
        id="sr-btn"
        type="button"
        aria-describedby="sr-note"
        onClick={() => (listening ? setListening(false) : start())}
        onBlur={() => setListening(false)}
        className={`cursor-pointer rounded-[9px] border px-[14px] py-[11px] text-left font-mono text-[.88rem] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px] ${
          listening
            ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_8%,var(--bg))] text-text-dim'
            : 'border-border bg-bg text-text hover:border-accent'
        }`}
      >
        <span>{display}</span>
      </button>
      <p className="m-0 text-[.74rem] text-text-dim" id="sr-note">
        {listening ? 'Listening. Escape cancels, Backspace clears.' : 'Click, then press the combination you want.'}
      </p>
      {conflict && <p className="m-0 text-[.76rem] text-accent">{conflict}</p>}
    </div>
  );
}
