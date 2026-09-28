/* Counts what a person would call a character.
   "👨‍👩‍👧‍👦" is one character to everyone who has ever looked at it, eleven UTF-16
   units to String.length, and seven code points to [...string]. A field that
   budgets on .length rejects a message the user can see is short — and a
   truncation that slices on .length cuts between the man and the woman, which
   renders as two separate people or a replacement glyph. */
(() => {
  const LIMIT = 40;

  // Intl.Segmenter is the only one of the three that agrees with the reader.
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

  const graphemes = (s) => seg ? [...seg.segment(s)].map((g) => g.segment) : [...s];

  document.querySelectorAll('[data-gbf]').forEach((root) => {
    const input = root.querySelector('[data-gbf-in]');
    const count = root.querySelector('[data-gbf-count]');
    const trunc = root.querySelector('[data-gbf-trunc]');
    const outUnits = root.querySelector('[data-gbf-units]');
    const outPoints = root.querySelector('[data-gbf-points]');
    const outGraph = root.querySelector('[data-gbf-graph]');

    const render = () => {
      const s = input.value;
      const g = graphemes(s);
      outUnits.textContent = s.length;
      outPoints.textContent = [...s].length;
      outGraph.textContent = g.length;

      const over = g.length - LIMIT;
      count.textContent = over > 0
        ? g.length + ' / ' + LIMIT + ' — ' + over + ' over'
        : g.length + ' / ' + LIMIT;
      if (over > 0) count.dataset.over = ''; else count.removeAttribute('data-over');
      trunc.disabled = over <= 0;
    };

    trunc.addEventListener('click', () => {
      /* Join whole graphemes. Slicing the raw string at LIMIT can cut inside a
         zero-width-joiner sequence or between a surrogate pair, producing a
         lone surrogate — an unpaired half of a character that renders as a
         replacement glyph and is invalid in JSON. */
      input.value = graphemes(input.value).slice(0, LIMIT).join('');
      render();
      input.focus();
    });

    input.addEventListener('input', render);
    if (!seg) {
      count.textContent = 'Intl.Segmenter unavailable — counting code points';
    }
    render();
  });
})();
