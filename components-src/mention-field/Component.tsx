import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

/** Someone who can be mentioned. */
export type Person = { id: string; label: string; hint?: string };

/** A mention inside the text: who, and the [start, end) span it occupies, including the @. */
export type Mention = { id: string; label: string; start: number; end: number };

/** What the field reports: the plain text and where the mentions sit in it. */
export type MentionValue = { text: string; mentions: Mention[] };

const DEFAULT_PEOPLE: Person[] = [
  { id: 'u1', label: 'Ana Lima', hint: 'Design' },
  { id: 'u2', label: 'Anders Holm', hint: 'Platform' },
  { id: 'u3', label: 'Bilal Rahman', hint: 'Support' },
  { id: 'u4', label: 'Chen Wei', hint: 'Data' },
  { id: 'u5', label: 'Dara Okafor', hint: 'Sales' },
  { id: 'u6', label: 'Eun-ji Park', hint: 'Design' },
];

/* Mentions are ranges over plain text, not markup inside it. The textarea
   stays a textarea — native undo, spellcheck, IME and paste all keep working —
   and the highlight is drawn by a mirror behind it with identical metrics. */

/* Find every "@Label" for a known person in a piece of text. Longest label
   first, so "@Anders Holm" is not read as "@Ana" plus noise; a mention must
   start the text or follow whitespace, and end at a word boundary. */
function resolve(text: string, people: readonly Person[], offset = 0): Mention[] {
  const byLength = [...people].sort((a, b) => b.label.length - a.label.length);
  const found: Mention[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '@' || (i > 0 && !/\s/.test(text[i - 1]!))) continue;
    const rest = text.slice(i + 1).toLowerCase();
    const p = byLength.find((x) => rest.startsWith(x.label.toLowerCase()) && !/\w/.test(rest[x.label.length] ?? ''));
    if (!p) continue;
    const end = i + 1 + p.label.length;
    found.push({ id: p.id, label: p.label, start: offset + i, end: offset + end });
    i = end - 1;
  }
  return found;
}

/* Carry the mention ranges across an arbitrary edit. Whatever the browser did
   — typing, cut, drag-drop, undo — the edit is the span between the common
   prefix and the common suffix of the two strings. A mention wholly outside it
   moves; one the edit touched is no longer a mention, because its text is no
   longer the name. */
function shift(prev: string, next: string, mentions: Mention[]): Mention[] {
  let a = 0;
  while (a < prev.length && a < next.length && prev[a] === next[a]) a++;
  let b = 0;
  while (b < prev.length - a && b < next.length - a && prev[prev.length - 1 - b] === next[next.length - 1 - b]) b++;
  const oldEnd = prev.length - b;
  const delta = next.length - prev.length;
  return mentions.flatMap((m) => {
    if (m.end <= a) return [m];
    if (m.start >= oldEnd) return [{ ...m, start: m.start + delta, end: m.end + delta }];
    return [];
  });
}

/* The "@query" the caret is currently in, if any: an @ that starts the text or
   follows whitespace, with no whitespace between it and the caret, and not
   already part of a mention. */
function activeQuery(text: string, caret: number, mentions: Mention[]) {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at === -1 || (at > 0 && !/\s/.test(before[at - 1]!))) return null;
  const q = before.slice(at + 1);
  if (/\s{2}|\n/.test(q) || q.length > 24) return null;
  if (mentions.some((m) => at >= m.start && at < m.end)) return null;
  return { at, q };
}

export interface MentionFieldProps {
  /** People who can be mentioned. */
  people?: readonly Person[];
  /** Starting text; any "@Label" for a known person becomes a mention. */
  defaultValue?: string;
  /** Visible label of the field. */
  label?: string;
  /** Placeholder shown while the field is empty. */
  placeholder?: string;
  /** Help text under the field. */
  help?: string;
  /** Most suggestions shown at once. */
  maxSuggestions?: number;
  /** Visible rows of the textarea. */
  rows?: number;
  /** Disables the field. */
  disabled?: boolean;
  /** Fired on every change with the text and the mention ranges. */
  onChange?: (value: MentionValue) => void;
  /** Fired when a mention is added, by picking from the list or by pasting a known name. */
  onMention?: (person: Person) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function MentionField({
  people = DEFAULT_PEOPLE,
  defaultValue = 'Thanks @Ana Lima — can you and @Chen Wei look at the export before Friday?',
  label = 'Comment',
  placeholder = 'Type @ to mention someone',
  help = 'Type @ to mention. Backspace removes a mention whole. Pasted @names are recognised.',
  maxSuggestions = 6,
  rows = 3,
  disabled = false,
  onChange,
  onMention,
  className = '',
}: MentionFieldProps) {
  const uid = useId().replace(/:/g, '');
  const [text, setText] = useState(defaultValue);
  const [mentions, setMentions] = useState<Mention[]>(() => resolve(defaultValue, people));
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  // The @ position the user dismissed with Escape; the list stays shut for it.
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const pendingCaret = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const query = focused && !disabled ? activeQuery(text, caret, mentions) : null;
  const matches = useMemo(() => {
    if (!query || query.at === dismissed) return [];
    const q = query.q.toLowerCase();
    return people
      .filter((p) => p.label.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)) || p.label.toLowerCase().startsWith(q))
      .slice(0, maxSuggestions);
  }, [query?.at, query?.q, dismissed, people, maxSuggestions]);
  const open = matches.length > 0;
  const current = Math.min(active, matches.length - 1);

  useEffect(() => { setActive(0); }, [query?.q]);

  // A caret placed by us (after a pick or a paste) is applied once React has written the text.
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !ta.current) return;
    ta.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    setCaret(pendingCaret.current);
    pendingCaret.current = null;
  });

  const commit = (nextText: string, nextMentions: Mention[]) => {
    setText(nextText);
    setMentions(nextMentions);
    onChangeRef.current?.({ text: nextText, mentions: nextMentions });
  };

  const pick = (p: Person) => {
    if (!query) return;
    const insert = `@${p.label} `;
    const end = query.at + 1 + query.q.length;
    const next = text.slice(0, query.at) + insert + text.slice(end);
    const moved = shift(text, next, mentions);
    commit(next, [...moved, { id: p.id, label: p.label, start: query.at, end: query.at + 1 + p.label.length }].sort((a, b) => a.start - b.start));
    pendingCaret.current = query.at + insert.length;
    onMention?.(p);
  };

  /* A caret is never left inside a mention: it is one token, so the caret
     crosses it whole. Which edge it lands on depends on where it came from —
     snapping to the nearer edge traps ArrowLeft, because one step left from
     the end is nearer the end, and the caret is put straight back. */
  const lastCaret = useRef(0);
  const snap = () => {
    const el = ta.current;
    if (!el || composing.current) return;
    const { selectionStart: s, selectionEnd: e } = el;
    if (s === e) {
      const m = mentions.find((x) => s > x.start && s < x.end);
      if (m) {
        const from = lastCaret.current;
        const to = from >= m.end ? m.start : from <= m.start ? m.end : s - m.start < m.end - s ? m.start : m.end;
        el.setSelectionRange(to, to);
        lastCaret.current = to;
        setCaret(to);
        return;
      }
    }
    lastCaret.current = e;
    setCaret(e);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter during IME composition confirms the composition, not a suggestion.
    if (e.nativeEvent.isComposing || composing.current) return;
    if (open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((current + 1) % matches.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((current - 1 + matches.length) % matches.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(matches[current]!); return; }
      if (e.key === 'Escape') { e.preventDefault(); setDismissed(query!.at); return; }
    }
    const el = e.currentTarget;
    if (el.selectionStart !== el.selectionEnd) return;
    const at = el.selectionStart;
    // Backspace after a mention, or Delete before one, removes it whole.
    const m = e.key === 'Backspace' ? mentions.find((x) => x.end === at)
      : e.key === 'Delete' ? mentions.find((x) => x.start === at) : undefined;
    if (!m) return;
    e.preventDefault();
    const next = text.slice(0, m.start) + text.slice(m.end);
    commit(next, shift(text, next, mentions.filter((x) => x !== m)));
    pendingCaret.current = m.start;
  };

  /* Pasted text is scanned for known names, so copying "@Ana Lima" from a
     previous comment brings the mention with it rather than plain text. */
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text/plain');
    if (!pasted.includes('@')) return;
    e.preventDefault();
    const el = e.currentTarget;
    const s = el.selectionStart, end = el.selectionEnd;
    const next = text.slice(0, s) + pasted + text.slice(end);
    const kept = shift(text, next, mentions);
    const added = resolve(pasted, people, s);
    commit(next, [...kept, ...added].sort((a, b) => a.start - b.start));
    added.forEach((m) => { const p = people.find((x) => x.id === m.id); if (p) onMention?.(p); });
    pendingCaret.current = s + pasted.length;
  };

  const syncScroll = () => {
    if (mirror.current && ta.current) mirror.current.scrollTop = ta.current.scrollTop;
  };

  // The mirror renders the same text with the mentions marked. A trailing
  // newline needs a character after it or the mirror is one line short.
  const pieces: React.ReactNode[] = [];
  let at = 0;
  for (const m of mentions) {
    if (m.start > at) pieces.push(text.slice(at, m.start));
    pieces.push(<mark key={m.start} className="mf-mark">{text.slice(m.start, m.end)}</mark>);
    at = m.end;
  }
  pieces.push(text.slice(at) + '​');

  const listId = `mf-${uid}-list`;
  const helpId = `mf-${uid}-help`;
  const optId = (i: number) => `mf-${uid}-opt-${i}`;

  return (
    <div className={`grid max-w-[460px] gap-[7px] ${className}`}>
      <label className="text-[.84rem] font-medium" htmlFor={`mf-${uid}`}>{label}</label>
      <div className={`mf-box relative rounded-[10px] border bg-bg ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${focused ? 'border-accent' : 'border-border hover:border-text-dim'}`}>
        <div ref={mirror} aria-hidden="true" className="mf-text mf-mirror pointer-events-none absolute inset-0 overflow-hidden text-text">
          {pieces}
        </div>
        <textarea
          ref={ta}
          id={`mf-${uid}`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? optId(current) : undefined}
          aria-describedby={helpId}
          rows={rows}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck
          onChange={(e) => {
            const next = e.target.value;
            commit(next, shift(text, next, mentions));
            setCaret(e.target.selectionEnd);
          }}
          onSelect={snap}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onScroll={syncScroll}
          onCompositionStart={() => { composing.current = true; }}
          onCompositionEnd={(e) => { composing.current = false; setCaret(e.currentTarget.selectionEnd); }}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setDismissed(null); }}
          className="mf-text mf-input relative block w-full resize-y bg-transparent focus:outline-none disabled:cursor-not-allowed"
        />
        <ul
          id={listId}
          role="listbox"
          aria-label="People"
          hidden={!open}
          className="absolute left-2 right-2 top-full z-10 m-0 mt-1 list-none rounded-[9px] border border-border bg-surface p-1 shadow-[var(--shadow)]"
        >
          {matches.map((p, i) => (
            <li
              key={p.id}
              id={optId(i)}
              role="option"
              aria-selected={i === current}
              // mousedown, not click: a click would blur the textarea first and close the list.
              onMouseDown={(e) => { e.preventDefault(); pick(p); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-[6px] px-[10px] py-[6px] text-[.86rem] ${i === current ? 'bg-[color-mix(in_oklab,var(--accent)_16%,transparent)]' : 'hover:bg-raised'}`}
            >
              <span>{p.label}</span>
              {p.hint && <span className="text-[.74rem] text-text-dim">{p.hint}</span>}
            </li>
          ))}
        </ul>
      </div>
      <p className="m-0 text-[.74rem] text-text-dim" id={helpId}>{help}</p>
      <p className="sr-only" aria-live="polite">
        {open ? `${matches.length} ${matches.length === 1 ? 'person matches' : 'people match'}` : ''}
      </p>
      <p className="m-0 font-mono text-[.7rem] text-text-dim">
        {mentions.length ? `mentions: ${mentions.map((m) => m.id).join(', ')}` : 'no mentions'}
      </p>
    </div>
  );
}
