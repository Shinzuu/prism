import { useMemo, useRef, useState } from 'react';

const DEFAULT_LIMIT = 40;
const DEFAULT_VALUE = 'Shipping 🇯🇵 today 👨‍👩‍👧‍👦 — café';

/* Intl.Segmenter is the only one of the three counts that agrees with a reader.
   A family emoji is one character to everyone who has looked at it, eleven
   UTF-16 units to String.length, and seven code points to [...string]. */
const segmenter: Intl.Segmenter | null =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

function graphemes(value: string): string[] {
  if (!segmenter) return [...value];
  return Array.from(segmenter.segment(value), (s) => s.segment);
}

type Row = { label: string; count: number; note: string; emphasis?: boolean };

export interface GraphemeBudgetFieldProps {
  /** Maximum number of graphemes (user-perceived characters) allowed. */
  limit?: number;
  /** Initial text in the field. */
  defaultValue?: string;
  /** Visible label above the field. */
  label?: string;
  /** Text on the truncate button. */
  truncateLabel?: string;
  /** Id for the textarea; the counter id is derived from it. Change it when rendering more than one. */
  id?: string;
  /** Disables the field and the truncate button. */
  disabled?: boolean;
  /** Fires on every edit and on truncate with the new value and its grapheme count. */
  onChange?: (value: string, graphemeCount: number) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function GraphemeBudgetField({
  limit = DEFAULT_LIMIT,
  defaultValue = DEFAULT_VALUE,
  label = 'Status message',
  truncateLabel = 'Truncate to limit',
  id = 'gbf-in',
  disabled = false,
  onChange,
  className = '',
}: GraphemeBudgetFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const units = value.length;
  const points = useMemo(() => [...value].length, [value]);
  const graphemeList = useMemo(() => graphemes(value), [value]);
  const count = graphemeList.length;
  const over = count - limit;
  const countId = id === 'gbf-in' ? 'gbf-count' : `${id}-count`;

  const update = (next: string) => {
    setValue(next);
    onChange?.(next, graphemes(next).length);
  };

  const rows: Row[] = [
    { label: '.length (UTF-16 units)', count: units, note: 'what most code counts' },
    { label: '[...string] (code points)', count: points, note: 'better, still wrong' },
    { label: 'Intl.Segmenter (graphemes)', count, note: 'what a person counts', emphasis: true },
  ];

  /* Join whole graphemes. Slicing the raw string can cut inside a zero-width
     joiner sequence or between a surrogate pair, and a lone surrogate renders
     as a replacement glyph and is not valid in JSON. */
  const truncate = () => {
    if (disabled) return;
    update(graphemeList.slice(0, limit).join(''));
    inputRef.current?.focus();
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      <label className="text-[.7rem] text-text-dim" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        ref={inputRef}
        rows={3}
        value={value}
        disabled={disabled}
        onChange={(e) => update(e.target.value)}
        aria-describedby={countId}
        className="w-full min-w-0 rounded-lg border border-border bg-bg px-[10px] py-2
                   font-sans text-[.84rem] leading-relaxed text-text
                   outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1
                   disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="flex flex-wrap items-center justify-between gap-[10px]">
        <p
          id={countId}
          aria-live="polite"
          className={`m-0 font-mono text-[.7rem] tabular-nums ${over > 0 ? 'text-accent' : 'text-text-dim'}`}
        >
          {segmenter
            ? over > 0
              ? `${count} / ${limit} — ${over} over`
              : `${count} / ${limit}`
            : 'Intl.Segmenter unavailable — counting code points'}
        </p>
        <button
          type="button"
          onClick={truncate}
          disabled={disabled || over <= 0}
          className="cursor-pointer rounded-md border border-border bg-raised px-[10px] py-[5px]
                     font-sans text-[.7rem] text-text hover:border-accent active:translate-y-px
                     disabled:cursor-default disabled:opacity-50 disabled:hover:border-border disabled:active:translate-y-0
                     focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          {truncateLabel}
        </button>
      </div>

      {/* The three counts side by side: the disagreement is the component. */}
      <table className="w-full border-collapse text-[.68rem]">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className={r.emphasis ? 'text-accent' : ''}>
              <th
                scope="row"
                className={`border-b border-border/45 px-[6px] py-1 text-left font-normal
                            ${r.emphasis ? 'border-b-0 text-accent' : 'text-text-dim'}`}
              >
                {r.label}
              </th>
              <td
                className={`w-12 border-b border-border/45 px-[6px] py-1 text-right font-mono tabular-nums
                            ${r.emphasis ? 'border-b-0 text-accent' : 'text-text'}`}
              >
                {r.count}
              </td>
              <td
                className={`border-b border-border/45 px-[6px] py-1 text-[.64rem] opacity-80
                            ${r.emphasis ? 'border-b-0 text-accent' : 'text-text-dim'}`}
              >
                {r.note}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
