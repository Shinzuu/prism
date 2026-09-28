/* The submenu problem: the panel sits to the right, so reaching it means moving
   diagonally — and a diagonal path crosses the item below, whose own hover
   closes the panel you were heading for. A timeout "fixes" it by making every
   interaction feel sluggish. The real fix is geometric: while the pointer is
   inside the triangle formed by where it left the item and the panel's two
   near corners, it is still on its way, so nothing closes. */
(() => {
  document.querySelectorAll('[data-sth]').forEach((root) => {
    const menu = root.querySelector('[data-sth-menu]');
    const panel = root.querySelector('[data-sth-panel]');
    const tri = root.querySelector('[data-sth-tri]');
    const poly = root.querySelector('[data-sth-poly]');
    const showTri = root.querySelector('[data-sth-show]');
    const disable = root.querySelector('[data-sth-off]');

    const CONTENT = {
      Runtime: ['Isolates', 'Cold starts', 'CPU budget'],
      Storage: ['KV namespaces', 'Durable objects', 'R2 buckets'],
      Network: ['Routes', 'Rate limits', 'Egress'],
      Billing: ['Plan', 'Invoices', 'Usage alerts'],
    };

    let open = null, safe = null;

    const openItem = (btn) => {
      if (open === btn) return;
      for (const b of menu.querySelectorAll('[data-sth-item]')) b.setAttribute('aria-expanded', String(b === btn));
      open = btn;
      const key = btn.dataset.sthItem;
      panel.hidden = false;
      panel.innerHTML = '<h4>' + key + '</h4><ul>' +
        CONTENT[key].map((i) => '<li>' + i + '</li>').join('') + '</ul>';
    };

    const closeAll = () => {
      open = null; safe = null;
      panel.hidden = true;
      poly.removeAttribute('points');
      for (const b of menu.querySelectorAll('[data-sth-item]')) b.setAttribute('aria-expanded', 'false');
    };

    /* Triangle: the pointer's position when it left the item, plus the panel's
       top-near and bottom-near corners. Any point inside is on a plausible
       path to the panel. */
    const buildSafe = (x, y) => {
      const r = root.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      safe = [
        [x - r.left, y - r.top],
        [p.left - r.left, p.top - r.top],
        [p.left - r.left, p.bottom - r.top],
      ];
      poly.setAttribute('points', safe.map((pt) => pt.join(',')).join(' '));
    };

    // Standard point-in-triangle by sign of the cross products.
    const inSafe = (x, y) => {
      if (!safe) return false;
      const r = root.getBoundingClientRect();
      const px = x - r.left, py = y - r.top;
      const sign = (a, b, c) => (px - c[0]) * (a[1] - c[1]) - (a[0] - c[0]) * (py - c[1]);
      const d1 = sign(safe[0], safe[1], safe[1]);
      const s = [
        (px - safe[1][0]) * (safe[0][1] - safe[1][1]) - (safe[0][0] - safe[1][0]) * (py - safe[1][1]),
        (px - safe[2][0]) * (safe[1][1] - safe[2][1]) - (safe[1][0] - safe[2][0]) * (py - safe[2][1]),
        (px - safe[0][0]) * (safe[2][1] - safe[0][1]) - (safe[2][0] - safe[0][0]) * (py - safe[0][1]),
      ];
      const neg = s.some((v) => v < 0), pos = s.some((v) => v > 0);
      return !(neg && pos);
    };

    menu.addEventListener('pointerover', (e) => {
      const btn = e.target.closest('[data-sth-item]');
      if (!btn) return;
      // The whole mechanism: inside the wedge, the hover is ignored.
      if (!disable.checked && inSafe(e.clientX, e.clientY)) return;
      openItem(btn);
      safe = null;
      poly.removeAttribute('points');
    });

    menu.addEventListener('pointerleave', (e) => {
      if (!open || disable.checked) return;
      buildSafe(e.clientX, e.clientY);
    });

    root.addEventListener('pointermove', (e) => {
      if (!safe || disable.checked) return;
      const overPanel = panel.contains(document.elementFromPoint(e.clientX, e.clientY));
      if (overPanel) { safe = null; poly.removeAttribute('points'); return; }
      if (!inSafe(e.clientX, e.clientY) && !menu.contains(e.target)) closeAll();
    });

    root.addEventListener('pointerleave', closeAll);

    // Keyboard: hover is not available, so focus opens and Escape closes.
    for (const b of menu.querySelectorAll('[data-sth-item]')) {
      b.addEventListener('focus', () => openItem(b));
      b.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
    }

    showTri.addEventListener('change', () => {
      if (showTri.checked) root.removeAttribute('data-hide-tri'); else root.dataset.hideTri = '';
    });
    disable.addEventListener('change', () => { safe = null; poly.removeAttribute('points'); });
  });
})();
