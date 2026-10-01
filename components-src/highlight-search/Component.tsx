import { useEffect, useRef, useState } from 'react';

const DEFAULT_PARAGRAPHS: readonly string[] = [
  "Pressure in a hydraulic line is transmitted equally in every direction. That is the whole of Pascal's principle, and it is why a small piston pressed with modest force can lift something enormous through a larger one.",
  "An aircraft's flight controls depend on it. Press the pedal and the pressure arrives at the brake within milliseconds, undiminished by the distance it travelled or the bends it took along the way.",
  'The compromise is compressibility. Any air trapped in the line compresses first, so the pressure you apply is spent squeezing a bubble rather than moving the piston — which is why the system is bled before anyone presses anything in anger.',
];

export interface HighlightSearchProps {
  /** Paragraphs of text to search; each renders as its own <p>. */
  paragraphs?: readonly string[];
  /** Search term the field starts with. */
  defaultTerm?: string;
  /** Visible label above the field. */
  label?: string;
  /** Accessible name for the scrollable text region. */
  regionLabel?: string;
  /** Id for the search input; the counter id is derived from it. Change it when rendering more than one. */
  id?: string;
  /** Disables the field and the previous/next buttons. */
  disabled?: boolean;
  /** Fires with the new term on every edit. */
  onChange?: (term: string) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

/* Find-in-page over live text using the CSS Custom Highlight API. No <mark>
   wrapping, so the DOM is never touched: highlights survive re-renders,
   virtualized lists and text some other component owns. */
export default function HighlightSearch({
  paragraphs = DEFAULT_PARAGRAPHS,
  defaultTerm = 'press',
  label = 'Find in this passage',
  regionLabel = 'Searchable text',
  id = 'hl-q',
  disabled = false,
  onChange,
  className = '',
}: HighlightSearchProps) {
  const docRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState(defaultTerm);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const ranges = useRef<Range[]>([]);
  const supported = typeof CSS !== 'undefined' && 'highlights' in CSS;

  useEffect(() => {
    if (!supported) return;
    const doc = docRef.current;
    if (!doc) return;

    const all = new Highlight();
    const current = new Highlight();
    CSS.highlights.set('hl-all', all);
    CSS.highlights.set('hl-current', current);

    const nodes: Text[] = [];
    const walk = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (n.nodeValue?.trim()) nodes.push(n as Text);

    const found: Range[] = [];
    const needle = term.trim().toLowerCase();
    if (needle) {
      for (const node of nodes) {
        const hay = node.nodeValue!.toLowerCase();
        let from = 0, at: number;
        while ((at = hay.indexOf(needle, from)) !== -1) {
          const r = new Range();
          r.setStart(node, at);
          r.setEnd(node, at + needle.length);
          found.push(r);
          all.add(r);
          from = at + needle.length;
        }
      }
    }
    ranges.current = found;
    setCount(found.length);

    const i = index >= found.length ? 0 : index;
    if (found[i]) {
      current.add(found[i]!);
      // A Range has no scrollIntoView; ask it for its box instead.
      const box = found[i]!.getBoundingClientRect();
      const view = doc.getBoundingClientRect();
      if (box.top < view.top || box.bottom > view.bottom) {
        doc.scrollTop += box.top - view.top - view.height / 2 + box.height / 2;
      }
    }
    return () => { CSS.highlights.delete('hl-all'); CSS.highlights.delete('hl-current'); };
  }, [term, index, supported, paragraphs]);

  const step = (by: number) => { if (count && !disabled) setIndex((i) => (i + by + count) % count); };
  const countId = id === 'hl-q' ? 'hl-n' : `${id}-n`;
  const nav = 'h-7 w-7 cursor-pointer rounded-[7px] border border-border bg-surface p-0 text-[.8rem] leading-none text-text hover:border-accent active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-40 disabled:hover:border-border disabled:active:translate-y-0';

  return (
    <div className={`grid gap-[9px] ${className}`}>
      <label className="text-[.84rem] font-medium" htmlFor={id}>{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          id={id} type="search" autoComplete="off" spellCheck={false} aria-describedby={countId}
          value={term} disabled={!supported || disabled}
          onChange={(e) => { setIndex(0); setTerm(e.target.value); onChange?.(e.target.value); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); } }}
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-[13px] py-[9px] font-sans text-[.88rem] text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span id={countId} aria-live="polite" className="min-w-[5.5ch] text-right font-mono text-[.72rem] tabular-nums text-text-dim">
          {!supported ? 'unsupported' : count ? `${index + 1}/${count}` : term.trim() ? '0' : ''}
        </span>
        <button type="button" aria-label="Previous match" disabled={!count || disabled} onClick={() => step(-1)} className={nav}>↑</button>
        <button type="button" aria-label="Next match" disabled={!count || disabled} onClick={() => step(1)} className={nav}>↓</button>
      </div>

      <div ref={docRef} tabIndex={0} role="region" aria-label={regionLabel} className="grid max-h-[190px] gap-[9px] overflow-y-auto text-[.86rem] leading-relaxed focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
        {paragraphs.map((t, i) => <p key={i} className="m-0 text-text-dim">{t}</p>)}
      </div>
    </div>
  );
}
