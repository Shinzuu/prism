/* Sorting normally teleports every row, so the row you were reading is simply
   gone and you have to find it again. FLIP moves them instead: measure First,
   reorder, measure Last, Invert with a transform, then Play. */
(() => {
  const ROWS = [
    { service: 'checkout-api', dur: 128, fails: 0, when: '09:14' },
    { service: 'search-index', dur: 412, fails: 3, when: '09:02' },
    { service: 'media-worker', dur: 96,  fails: 0, when: '08:51' },
    { service: 'auth-edge',    dur: 233, fails: 1, when: '08:40' },
    { service: 'billing-sync', dur: 517, fails: 7, when: '08:22' },
    { service: 'notify-fan',   dur: 61,  fails: 0, when: '08:05' },
    { service: 'report-batch', dur: 344, fails: 2, when: '07:48' },
  ];

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-smt]').forEach((root) => {
    const body = root.querySelector('[data-smt-body]');
    const meta = root.querySelector('[data-smt-meta]');
    const buttons = [...root.querySelectorAll('[data-smt-key]')];
    let key = 'when', dir = 1;

    const render = () => {
      body.replaceChildren();
      for (const r of ROWS) {
        const tr = document.createElement('tr');
        tr.dataset.k = r.service;
        if (r.fails > 0) tr.dataset.hot = '1';
        tr.innerHTML = '<td>' + r.service + '</td><td>' + r.dur + 'ms</td><td>' +
          r.fails + '</td><td>' + r.when + '</td>';
        body.append(tr);
      }
    };

    const sortRows = () => {
      ROWS.sort((a, b) => {
        const av = a[key], bv = b[key];
        return (typeof av === 'string' ? av.localeCompare(bv) : av - bv) * dir;
      });
    };

    const apply = () => {
      /* FIRST — measure before touching the DOM. getBoundingClientRect is the
         only honest source here; offsetTop lies once a transform is applied. */
      const first = new Map();
      for (const tr of body.children) first.set(tr.dataset.k, tr.getBoundingClientRect().top);

      sortRows();
      render();

      if (reduced.matches) return;   // reordered, just not animated

      for (const tr of body.children) {
        const before = first.get(tr.dataset.k);
        if (before == null) continue;
        const after = tr.getBoundingClientRect().top;   // LAST
        const dy = before - after;                      // INVERT
        if (!dy) continue;
        tr.dataset.moving = '';
        // PLAY. Web Animations, so no library and no cleanup of inline styles.
        const anim = tr.animate(
          [{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
        anim.finished.then(() => tr.removeAttribute('data-moving')).catch(() => {});
      }
    };

    for (const b of buttons) {
      b.addEventListener('click', () => {
        if (b.dataset.smtKey === key) dir = -dir; else { key = b.dataset.smtKey; dir = 1; }
        for (const other of buttons) other.removeAttribute('aria-sort');
        b.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
        meta.textContent = 'Sorted by ' + b.textContent.trim().toLowerCase() +
          ', ' + (dir === 1 ? 'ascending' : 'descending');
        apply();
      });
    }

    sortRows(); render();
  });
})();
