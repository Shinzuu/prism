import { useEffect, useRef, useState } from 'react';

/* Keyed by CLDR plural CATEGORY, not by number. Writing `n === 1 ? a : b`
   bakes English grammar into the code and cannot express Polish's `few` or
   Arabic's dual. */
type Msgs = { dir: 'ltr' | 'rtl' } & Partial<Record<Intl.LDMLPluralRule, string>>;

const MESSAGES: Record<string, Msgs> = {
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

const LOCALES = [
  ['en', 'English'], ['pl', 'Polski'], ['ru', 'Русский'], ['ar', 'العربية'], ['ja', '日本語'],
] as const;

const TOTAL = 23;

export default function LocalizedProgressLoader() {
  const [locale, setLocale] = useState<string>('en');
  const [n, setN] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // Do not run the simulation off-screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setN((v) => {
        const next = v >= TOTAL ? 0 : v + 1;
        timer = setTimeout(tick, next === 0 ? 900 : 420);
        return next;
      });
    };
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        clearTimeout(timer);
        if (e.isIntersecting) timer = setTimeout(tick, 420);
      }
    }, { rootMargin: '80px' });
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, []);

  const m = MESSAGES[locale]!;
  const category = new Intl.PluralRules(locale).select(n);
  // Fall back to `other`, which every language defines.
  const template = m[category] ?? m.other!;
  const nf = new Intl.NumberFormat(locale);
  const pct = Math.round((n / TOTAL) * 100);

  return (
    <div ref={rootRef} dir={m.dir} className="grid gap-2">
      <div className="flex items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem]" lang={locale} dir={m.dir} aria-live="polite">
          {template.replace('{n}', nf.format(n))}
        </p>
        <select
          aria-label="Language"
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="cursor-pointer rounded-md border border-border bg-raised px-[7px] py-1 font-sans text-[.68rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          {LOCALES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* The fill grows from the INLINE start, so it follows the text direction
          instead of always running left to right. */}
      <div
        role="progressbar"
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
