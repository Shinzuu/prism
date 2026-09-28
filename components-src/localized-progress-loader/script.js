/* "Uploading 1 files" is the tell that a string was concatenated.
   Plural category is a property of the language, not of the number: English
   has two, Polish has four, Arabic has six, Japanese has one. Intl.PluralRules
   answers which one applies; the component then picks the matching sentence. */
(() => {
  /* Keyed by CLDR plural category, not by number. Writing `n === 1 ? a : b`
     bakes English grammar into the code and cannot express Polish's `few`. */
  const MESSAGES = {
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

  document.querySelectorAll('[data-lpl]').forEach((root) => {
    const say = root.querySelector('[data-lpl-say]');
    const meta = root.querySelector('[data-lpl-meta]');
    const fill = root.querySelector('[data-lpl-fill]');
    const track = root.querySelector('[data-lpl-track]');
    const loc = root.querySelector('[data-lpl-loc]');

    let n = 0, total = 23, timer = null;

    const render = () => {
      const tag = loc.value;
      const m = MESSAGES[tag];
      const pr = new Intl.PluralRules(tag);
      const cat = pr.select(n);
      // Fall back to `other`, which every language defines.
      const tpl = m[cat] || m.other;
      const nf = new Intl.NumberFormat(tag);

      say.textContent = tpl.replace('{n}', nf.format(n));
      say.lang = tag; say.dir = m.dir;
      root.dir = m.dir;

      const pct = Math.round((n / total) * 100);
      fill.style.width = pct + '%';
      track.setAttribute('aria-valuenow', pct);
      meta.textContent = nf.format(pct) + '% · Intl.PluralRules → "' + cat + '"';
      meta.lang = tag;
    };

    const tick = () => {
      n = n >= total ? 0 : n + 1;
      render();
      timer = setTimeout(tick, n === 0 ? 900 : 420);
    };

    loc.addEventListener('change', render);

    new IntersectionObserver((es) => {
      for (const e of es) {
        if (e.isIntersecting) { clearTimeout(timer); tick(); }
        else clearTimeout(timer);
      }
    }, { rootMargin: '80px' }).observe(root);

    render();
  });
})();
