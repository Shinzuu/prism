/* A toolbar that measures ITSELF. Media queries answer "how wide is the
   viewport", which is not the question — a toolbar in a sidebar is narrow on a
   wide screen, and at 400% browser zoom the viewport reports 320px while the
   text is four times its usual size. Only the element's own box knows. */
(() => {
  document.querySelectorAll('[data-pot]').forEach((root) => {
    const bar = root.querySelector('[data-pot-bar]');
    const host = root.querySelector('[data-pot-host]');
    const more = root.querySelector('[data-pot-more]');
    const toggle = root.querySelector('[data-pot-toggle]');
    const menu = root.querySelector('[data-pot-menu]');
    const nOut = root.querySelector('[data-pot-n]');
    const note = root.querySelector('[data-pot-note]');
    const slider = root.querySelector('[data-pot-w]');
    const pxOut = root.querySelector('[data-pot-px]');

    const actions = [...bar.querySelectorAll('.pot__act:not(.pot__act--more)')];
    /* Widths measured once, with everything visible. Measuring during the fit
       loop reads widths that the loop itself is changing. */
    let widths = null;

    const measure = () => {
      for (const a of actions) a.hidden = false;
      more.hidden = true;
      widths = actions.map((a) => a.getBoundingClientRect().width + 5);
    };

    const fit = () => {
      if (!widths) measure();
      const avail = bar.clientWidth - 14;           // padding
      const moreW = 86;

      // Lowest priority leaves first, so "Save" survives to the last.
      const order = actions.map((a, i) => ({ a, i, pri: +a.dataset.pri }))
        .sort((x, y) => y.pri - x.pri);

      let used = widths.reduce((s, w) => s + w, 0);
      const hidden = [];
      for (const item of order) {
        if (used <= avail) break;
        hidden.push(item);
        used -= widths[item.i];
        // Once anything overflows, the More button itself needs room.
        if (hidden.length === 1) used += moreW;
      }

      const hiddenSet = new Set(hidden.map((h) => h.i));
      actions.forEach((a, i) => { a.hidden = hiddenSet.has(i); });
      more.hidden = hiddenSet.size === 0;
      nOut.textContent = hiddenSet.size ? ' (' + hiddenSet.size + ')' : '';

      menu.replaceChildren();
      for (const item of hidden.slice().sort((x, y) => x.pri - y.pri)) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'pot__mi'; b.role = 'menuitem';
        b.textContent = item.a.textContent;
        menu.append(b);
      }
      if (hiddenSet.size === 0) closeMenu();
      note.textContent = 'container ' + Math.round(bar.clientWidth) + 'px · ' +
        (actions.length - hiddenSet.size) + ' shown, ' + hiddenSet.size + ' in menu';
    };

    const closeMenu = () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) menu.querySelector('.pot__mi')?.focus();
    });
    document.addEventListener('click', (e) => { if (!more.contains(e.target)) closeMenu(); });
    menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); toggle.focus(); } });

    slider.addEventListener('input', () => {
      host.style.maxWidth = slider.value + 'px';
      pxOut.textContent = slider.value + 'px';
    });

    // ResizeObserver, not a resize listener: the element can change width
    // without the window doing anything at all.
    new ResizeObserver(fit).observe(bar);
    host.style.maxWidth = slider.value + 'px';
    pxOut.textContent = slider.value + 'px';
    measure();
    fit();
  });
})();
