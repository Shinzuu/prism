/* Resizable columns that do not shift while you drag, and that can be resized
   from the keyboard. table-layout: fixed is what makes the first part true. */
(() => {
  const MIN = 64, KEY = 'prism-col-widths';

  document.querySelectorAll('[data-cz]').forEach((root) => {
    const table = root.querySelector('[data-cz-table]');
    const heads = [...table.querySelectorAll('thead th')];
    const defaults = heads.map((h) => parseInt(h.style.getPropertyValue('--w')) || 120);

    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(heads.map((h) => parseInt(h.style.getPropertyValue('--w'))))); }
      catch { /* private mode: widths simply do not persist */ }
    }
    function load() {
      try {
        const w = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (Array.isArray(w) && w.length === heads.length) {
          w.forEach((v, i) => setWidth(i, v, false));
        }
      } catch { /* ignore */ }
    }

    function setWidth(i, px, persist = true) {
      const w = Math.max(MIN, Math.round(px));
      heads[i].style.setProperty('--w', w + 'px');
      const grip = heads[i].querySelector('[data-cz-grip]');
      if (grip) grip.setAttribute('aria-valuenow', w);
      if (persist) save();
    }

    heads.forEach((th, i) => {
      const grip = th.querySelector('[data-cz-grip]');
      if (!grip) return;
      let startX = 0, startW = 0;

      grip.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startW = th.getBoundingClientRect().width;
        grip.setPointerCapture(e.pointerId);
        root.dataset.resizing = 'true';
      });
      grip.addEventListener('pointermove', (e) => {
        if (root.dataset.resizing !== 'true' || !grip.hasPointerCapture?.(e.pointerId)) return;
        setWidth(i, startW + (e.clientX - startX), false);
      });
      const end = () => { if (root.dataset.resizing) { delete root.dataset.resizing; save(); } };
      grip.addEventListener('pointerup', end);
      grip.addEventListener('pointercancel', end);

      grip.addEventListener('keydown', (e) => {
        const cur = parseInt(th.style.getPropertyValue('--w'));
        const step = e.shiftKey ? 40 : 8;
        if (e.key === 'ArrowRight') { e.preventDefault(); setWidth(i, cur + step); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); setWidth(i, cur - step); }
        else if (e.key === 'Home') { e.preventDefault(); setWidth(i, MIN); }
        else if (e.key === 'Enter') { e.preventDefault(); setWidth(i, defaults[i]); }
      });
    });

    root.querySelector('[data-cz-reset]').addEventListener('click', () => {
      defaults.forEach((w, i) => setWidth(i, w, false));
      save();
    });

    load();
  });
})();
