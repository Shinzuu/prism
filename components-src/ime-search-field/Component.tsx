import { useRef, useState } from 'react';

/* Typing 你好 on a pinyin IME emits the intermediate letters n, ni, nih, niha,
   nihao as real input events. A field that queries on input searches the pinyin
   five times and matches nothing — and the bug does not exist in Latin script,
   so it ships. */
export default function ImeSearchField() {
  const [value, setValue] = useState('');
  const [state, setState] = useState<'idle' | 'typing' | 'composing'>('idle');
  const [good, setGood] = useState<string[]>([]);
  const [bad, setBad] = useState<string[]>([]);
  const composing = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = (set: typeof setGood, line: string) =>
    set((prev) => [line, ...prev].slice(0, 6));

  const query = (v: string, set: typeof setGood) => { if (v) push(set, `GET /search?q=${v}`); };

  const guarded = (v: string) => {
    /* Two independent guards, and both are needed. compositionstart/end bracket
       the composition; event.isComposing catches the input event that fires
       BEFORE compositionend in Safari and Firefox, which the flag alone would
       let through. */
    if (composing.current) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => query(v, setGood), 140);
  };

  // Replay a pinyin composition, so the difference is visible without an IME.
  const replay = () => {
    setValue(''); setGood([]); setBad([]);
    composing.current = true;
    setState('composing');
    const steps = ['n', 'ni', 'nih', 'niha', 'nihao'];
    steps.forEach((s, i) => {
      setTimeout(() => {
        setValue(s);
        query(s, setBad);                  // the naive field fires on each
        if (i === steps.length - 1) {
          setTimeout(() => {
            setValue('你好');
            query('你好', setBad);
            composing.current = false;
            setState('idle');
            query('你好', setGood);        // the one real query
          }, 170);
        }
      }, 170 * i);
    });
  };

  const log = (lines: string[], tone: string) => (
    <ol className={`m-0 flex min-h-[5.2rem] list-none flex-col-reverse justify-end overflow-hidden rounded-lg border bg-bg px-2 py-[7px] font-mono text-[.64rem] leading-[1.7] text-text-dim ${tone}`}>
      {lines.map((l, i) => <li key={`${l}-${i}`} className="truncate">{l}</li>)}
    </ol>
  );

  return (
    <div className="grid gap-[10px]">
      <label className="text-[.74rem] text-text-dim" htmlFor="ime-q">Search products</label>
      <div className="relative flex items-center">
        <input
          id="ime-q"
          type="search"
          autoComplete="off"
          placeholder="Type — or compose with an IME"
          value={value}
          onCompositionStart={() => { composing.current = true; setState('composing'); }}
          onCompositionEnd={(e) => {
            composing.current = false;
            setState('idle');
            // The composed word is only final here: this is the one real query.
            guarded(e.currentTarget.value);
          }}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            const isComposing = (e.nativeEvent as InputEvent).isComposing;
            setState(isComposing ? 'composing' : 'typing');
            query(v, setBad);              // the unguarded field
            if (isComposing) return;        // belt as well as braces
            guarded(v);
          }}
          className="flex-1 rounded-[9px] border border-border bg-bg py-[9px] pl-[11px] pr-[5.4rem] font-sans text-[.84rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
        />
        <span className={`absolute right-[9px] rounded-[5px] border px-1.5 py-0.5 font-mono text-[.6rem] ${
          state === 'composing' ? 'border-accent text-accent' : 'border-border text-text-dim'
        } bg-raised`}>
          {state}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-[10px]">
        <div>
          <p className="m-0 mb-1 text-[.68rem] text-text-dim">This field</p>
          {log(good, 'border-border')}
        </div>
        <div>
          <p className="m-0 mb-1 text-[.68rem] text-accent">Without the guard</p>
          {log(bad, 'border-[color-mix(in_oklab,var(--accent)_40%,var(--border))]')}
        </div>
      </div>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        Type <b className="font-normal font-mono text-text">nihao</b> with a Chinese IME and the naive
        field fires five queries for the letters. This one fires once, for 你好.
      </p>
      <button
        type="button"
        onClick={replay}
        className="cursor-pointer justify-self-start rounded-[7px] border border-border bg-raised px-[11px] py-1.5 font-sans text-[.74rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Replay a composition
      </button>
    </div>
  );
}
