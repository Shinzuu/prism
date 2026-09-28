/* Find-in-page over live text using the CSS Custom Highlight API. No <mark>
   wrapping, so the DOM is never touched: highlights survive re-renders,
   virtualized lists and text that other code owns. */
(() => {
  const OK = typeof CSS !== 'undefined' && CSS.highlights;

  document.querySelectorAll('[data-hl]').forEach((root) => {
    const input = root.querySelector('.hl__in');
    const doc = root.querySelector('[data-hl-doc]');
    const readout = root.querySelector('[data-hl-n]');
    const prev = root.querySelector('[data-hl-prev]');
    const next = root.querySelector('[data-hl-next]');

    if (!OK) {
      readout.textContent = 'unsupported';
      input.disabled = prev.disabled = next.disabled = true;
      return;
    }

    const all = new Highlight();
    const current = new Highlight();
    CSS.highlights.set('hl-all', all);
    CSS.highlights.set('hl-current', current);

    // Collect text nodes once; ranges are built against these.
    const nodes = [];
    const walk = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (n.nodeValue.trim()) nodes.push(n);

    let ranges = [], index = 0;

    function find() {
      all.clear(); current.clear();
      ranges = [];
      const term = input.value.trim().toLowerCase();
      if (!term) return paint();

      for (const node of nodes) {
        const hay = node.nodeValue.toLowerCase();
        let from = 0, at;
        while ((at = hay.indexOf(term, from)) !== -1) {
          const r = new Range();
          r.setStart(node, at);
          r.setEnd(node, at + term.length);
          ranges.push(r);
          all.add(r);
          from = at + term.length;
        }
      }
      if (index >= ranges.length) index = 0;
      paint();
    }

    function paint() {
      current.clear();
      const has = ranges.length > 0;
      prev.disabled = next.disabled = !has;
      readout.textContent = has ? `${index + 1}/${ranges.length}` : input.value.trim() ? '0' : '';
      if (!has) return;
      current.add(ranges[index]);
      // A Range has no scrollIntoView; ask it for its box instead.
      const box = ranges[index].getBoundingClientRect();
      const view = doc.getBoundingClientRect();
      if (box.top < view.top || box.bottom > view.bottom) {
        doc.scrollTop += box.top - view.top - view.height / 2 + box.height / 2;
      }
    }

    function step(by) {
      if (!ranges.length) return;
      index = (index + by + ranges.length) % ranges.length;
      paint();
    }

    input.addEventListener('input', () => { index = 0; find(); });
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      step(e.shiftKey ? -1 : 1);
    });
    next.addEventListener('click', () => step(1));
    prev.addEventListener('click', () => step(-1));

    find();
  });
})();
