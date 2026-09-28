/* The same ten names take four different orders depending on the locale.
   Array.prototype.sort() with no comparator sorts by UTF-16 code point, which
   puts every accented letter after Z — so Öberg lands after Zettel in every
   language on earth, which is correct in none of them. */
(() => {
  /* Chosen so that every option below produces a DIFFERENT order. Names that
     do not separate the locales make the component look like it works while
     demonstrating nothing: Cem/Çelik separates Turkish from English, Işık/İnönü
     separates dotless ı from dotted i, and Åkerman/Öberg separates Swedish. */
  const NAMES = ['Åkerman', 'Özdemir', 'Oberg', 'Zettel', 'Işık', 'İnönü',
                 'Cem', 'Çelik', 'Andersson', 'Öberg', 'Müller', 'Mueller'];

  const EXPLAIN = {
    en: 'Accents are minor differences, so Ö files with O and Ç with C. German dictionary order agrees — for these names the two are identical.',
    sv: 'Å, Ä and Ö are distinct letters that come AFTER Z, so three names jump to the end.',
    tr: 'C sorts before Ç, and dotless ı before dotted i — so Cem precedes Çelik and Işık precedes İnönü, the reverse of English.',
    __code: 'No collator. Code-point order puts every non-ASCII letter after Z — wrong in every language, including English.',
  };

  document.querySelectorAll('[data-cst]').forEach((root) => {
    const list = root.querySelector('[data-cst-list]');
    const note = root.querySelector('[data-cst-note]');
    const loc = root.querySelector('[data-cst-loc]');
    let prev = null;

    const sorted = () => {
      if (loc.value === '__code') return [...NAMES].sort();
      /* One Collator, reused. Building it inside a comparator constructs it
         once per comparison — O(n log n) collators for one sort. */
      const collator = new Intl.Collator(loc.value, { sensitivity: 'variant' });
      return [...NAMES].sort(collator.compare);
    };

    const render = () => {
      const order = sorted();
      list.replaceChildren();
      order.forEach((name, i) => {
        const li = document.createElement('li');
        li.className = 'cst__row';
        li.innerHTML = '<span class="cst__k">' + name + '</span>';
        // Mark what moved from the previous ordering, so the difference reads.
        if (prev && prev[i] !== name) li.dataset.moved = '';
        list.append(li);
      });
      note.textContent = EXPLAIN[loc.value];
      note.lang = loc.value === '__code' ? 'en' : loc.value;
      prev = order;
    };

    loc.addEventListener('change', render);
    render();
  });
})();
