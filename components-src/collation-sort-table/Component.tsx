import { useMemo, useRef, useState } from 'react';

/* Chosen so every option below produces a DIFFERENT order. Names that do not
   separate the locales make the component look like it works while
   demonstrating nothing: Cem/Çelik separates Turkish from English, Işık/İnönü
   separates dotless ı from dotted i, Åkerman/Öberg separates Swedish. */
const DEFAULT_NAMES: string[] = ['Åkerman', 'Özdemir', 'Oberg', 'Zettel', 'Işık', 'İnönü',
                                 'Cem', 'Çelik', 'Andersson', 'Öberg', 'Müller', 'Mueller'];

/** value is a BCP 47 locale, or '__code' for a bare code-point sort. */
export type CollationOption = { value: string; label: string; note: string };

const DEFAULT_OPTIONS: readonly CollationOption[] = [
  { value: 'en', label: 'English and German — Ö files with O',
    note: 'Accents are minor differences, so Ö files with O and Ç with C. German dictionary order agrees — for these names the two are identical.' },
  { value: 'sv', label: 'Swedish — Å Ä Ö are letters after Z',
    note: 'Å, Ä and Ö are distinct letters that come AFTER Z, so three names jump to the end.' },
  { value: 'tr', label: 'Turkish — C before Ç, dotless ı before i',
    note: 'C sorts before Ç, and dotless ı before dotted i — so Cem precedes Çelik and Işık precedes İnönü, the reverse of English.' },
  { value: '__code', label: 'Code point order (bare .sort())',
    note: 'No collator. Code-point order puts every non-ASCII letter after Z — wrong in every language, including English.' },
] as const;

export interface CollationSortTableProps {
  /** Strings to sort. */
  names?: string[];
  /** Sort rules offered in the picker, each with an explanatory note. */
  options?: readonly CollationOption[];
  /** Option value selected on first render. */
  defaultLocale?: string;
  /** Heading above the list. */
  title?: string;
  /** Dimmed text after the heading. */
  subtitle?: string;
  /** Accessible label of the rules picker. */
  selectLabel?: string;
  /** Disables the rules picker. */
  disabled?: boolean;
  /** Fired when the rules change, with the new value and the resulting order. */
  onLocaleChange?: (locale: string, order: string[]) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

const sortBy = (names: string[], locale: string) => {
  if (locale === '__code') return [...names].sort();
  /* One Collator, reused. Building it inside the comparator constructs one
     per comparison — O(n log n) collators for a single sort — and defaults
     to the runtime's locale, so the same data sorts differently per machine. */
  const collator = new Intl.Collator(locale, { sensitivity: 'variant' });
  return [...names].sort(collator.compare);
};

export default function CollationSortTable({
  names = DEFAULT_NAMES,
  options = DEFAULT_OPTIONS,
  defaultLocale = 'en',
  title = 'Attendees',
  subtitle = '— sorted by name',
  selectLabel = 'Sort using the rules of',
  disabled = false,
  onLocaleChange,
  className = '',
}: CollationSortTableProps) {
  const [locale, setLocale] = useState<string>(defaultLocale);
  const previous = useRef<string[] | null>(null);

  const order = useMemo(() => sortBy(names, locale), [names, locale]);

  const moved = order.map((n, i) => previous.current !== null && previous.current[i] !== n);
  previous.current = order;

  const note = options.find((o) => o.value === locale)?.note ?? '';

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">
          {title} <span className="font-normal text-text-dim">{subtitle}</span>
        </p>
        <select
          aria-label={selectLabel}
          value={locale}
          disabled={disabled}
          onChange={(e) => {
            if (disabled) return;
            setLocale(e.target.value);
            onLocaleChange?.(e.target.value, sortBy(names, e.target.value));
          }}
          className="cursor-pointer rounded-md border border-border bg-raised px-[7px] py-1 font-sans text-[.68rem] text-text hover:border-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <ol className="m-0 grid list-none gap-0.5 p-0 [counter-reset:n]">
        {order.map((name, i) => (
          <li
            key={name}
            className={`grid grid-cols-[1.7rem_1fr] items-baseline gap-2 rounded-md border bg-bg px-[9px] py-[5px] text-[.78rem] [counter-increment:n] before:font-mono before:text-[.64rem] before:text-text-dim before:content-[counter(n)] ${
              moved[i] ? 'border-[color-mix(in_oklab,var(--accent)_45%,transparent)]' : 'border-transparent'
            }`}
          >
            <span className={`tabular-nums ${moved[i] ? 'text-accent' : ''}`}>{name}</span>
          </li>
        ))}
      </ol>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim" lang={locale === '__code' ? 'en' : locale}>
        {note}
      </p>
    </div>
  );
}
