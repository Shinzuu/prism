import { useEffect, useRef, useState } from 'react';

/* Keyed by CLDR plural CATEGORY, not by number. Writing `n === 1 ? a : b`
   bakes English grammar into the code and cannot express Polish's `few` or
   Arabic's dual. */
export type LocaleMessages = { dir: 'ltr' | 'rtl' } & Partial<Record<Intl.LDMLPluralRule, string>>;

/** A selectable language: [BCP 47 tag, name shown in the menu]. */
export type LocaleOption = readonly [tag: string, name: string];

const DEFAULT_MESSAGES: Record<string, LocaleMessages> = {
  en: { dir: 'ltr', one: 'Uploading {n} file', other: 'Uploading {n} files' },
  pl: { dir: 'ltr', one: 'Przesyłanie {n} pliku', few: 'Przesyłanie {n} plików',
        many: 'Przesyłanie {n} plików', other: 'Przesyłanie {n} pliku' },
  ru: { dir: 'ltr', one: 'Загрузка {n} файла', few: 'Загрузка {n} файлов',
        many: 'Загрузка {n} файлов', other: 'Загрузка {n} файла' },
  ar: { dir: 'rtl', zero: 'جارٍ رفع {n} ملف', one: 'جارٍ رفع ملف واحد',
        two: 'جارٍ رفع ملفين', few: 'جارٍ رفع {n} ملفات',
        many: 'جارٍ رفع {n} ملفًا', other: 'جارٍ رفع {n} ملف' },
  ja: { dir: 'ltr', other: '{n} 件のファイルをアップロード中' },
};

const DEFAULT_LOCALES: readonly LocaleOption[] = [
  ['en', 'English'], ['pl', 'Polski'], ['ru', 'Русский'], ['ar', 'العربية'], ['ja', '日本語'],
];

export interface LocalizedProgressLoaderProps {
  /** Plural templates per locale; `{n}` is replaced with the localised count. Every locale needs `other`. */
  messages?: Record<string, LocaleMessages>;
  /** Languages offered in the menu; each tag must have an entry in `messages`. */
  locales?: readonly LocaleOption[];
  /** Locale selected on first render. */
  defaultLocale?: string;
  /** Number of items the progress counts towards. */
  total?: number;
  /** Items done so far. Leave undefined to run the built-in simulation. */
  value?: number;
  /** Delay between simulated items, in ms. */
  tickMs?: number;
  /** Pause after the simulation completes before it starts over, in ms. */
  restartMs?: number;
  /** Accessible name for the language menu. */
  languageLabel?: string;
  /** Disables the language menu. */
  disabled?: boolean;
  /** Fires when the reader picks another language. */
  onLocaleChange?: (locale: string) => void;
  /** Id for the status line that names the bar; change it when rendering more than one. */
  id?: string;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function LocalizedProgressLoader({
  messages = DEFAULT_MESSAGES,
  locales = DEFAULT_LOCALES,
  defaultLocale = 'en',
  total: TOTAL = 23,
  value,
  tickMs = 420,
  restartMs = 900,
  languageLabel = 'Language',
  disabled = false,
  onLocaleChange,
  id = 'lpl-label',
  className = '',
}: LocalizedProgressLoaderProps) {
  const [locale, setLocale] = useState<string>(defaultLocale);
  const [simulated, setN] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const controlled = value !== undefined;
  const n = value !== undefined ? Math.min(TOTAL, Math.max(0, value)) : simulated;

  // Do not run the simulation off-screen.
  useEffect(() => {
    if (controlled) return;
    const el = rootRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setN((v) => {
        const next = v >= TOTAL ? 0 : v + 1;
        timer = setTimeout(tick, next === 0 ? restartMs : tickMs);
        return next;
      });
    };
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        clearTimeout(timer);
        if (e.isIntersecting) timer = setTimeout(tick, tickMs);
      }
    }, { rootMargin: '80px' });
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, [controlled, TOTAL, tickMs, restartMs]);

  const m = messages[locale]!;
  const category = new Intl.PluralRules(locale).select(n);
  // Fall back to `other`, which every language defines.
  const template = m[category] ?? m.other!;
  const nf = new Intl.NumberFormat(locale);
  const pct = Math.round((n / TOTAL) * 100);

  return (
    <div ref={rootRef} dir={m.dir} className={`grid gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-[10px]">
        <p id={id} className="m-0 text-[.82rem]" lang={locale} dir={m.dir} aria-live="polite">
          {template.replace('{n}', nf.format(n))}
        </p>
        <select
          aria-label={languageLabel}
          value={locale}
          disabled={disabled}
          onChange={(e) => { setLocale(e.target.value); onLocaleChange?.(e.target.value); }}
          className="cursor-pointer rounded-md border border-border bg-raised px-[7px] py-1 font-sans text-[.68rem] text-text hover:border-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border"
        >
          {locales.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* The fill grows from the INLINE start, so it follows the text direction
          instead of always running left to right. */}
      <div
        role="progressbar"
        /* The status line already says what is being counted, in the chosen
           language. Pointing at it names the bar without adding a second,
           English-only string beside a localised one. */
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-[10px] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--border)_55%,transparent)]"
      >
        <div className="lpl-fill ms-0 h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>

      <p className="m-0 font-mono text-[.66rem] tabular-nums text-text-dim" lang={locale}>
        {nf.format(pct)}% · Intl.PluralRules → "{category}"
      </p>
    </div>
  );
}
