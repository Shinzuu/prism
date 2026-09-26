/* Arrow keys move to the tile the eye expects, computed from geometry rather
   than DOM order. With mixed tile sizes those two orders disagree constantly,
   which is why DOM-order navigation feels wrong in any non-uniform grid. */
(() => {
  document.querySelectorAll('[data-sn2]').forEach((root) => {
    const grid = root.querySelector('[data-sn2-grid]');
    const now = root.querySelector('[data-sn2-now]');
    const tiles = [...grid.querySelectorAll('.sn2__tile')];
    tiles.forEach((t, i) => (t.tabIndex = i === 0 ? 0 : -1));

    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, b: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };

    /* Pick the nearest candidate in the travel direction, scoring the distance
       along the axis of travel far more heavily than the drift across it, so a
       slightly offset neighbour beats a distant aligned one. */
    function best(from, dir) {
      const a = box(from);
      let winner = null, score = Infinity;
      for (const el of tiles) {
        if (el === from) continue;
        const b = box(el);
        let along, across;
        if (dir === 'ArrowRight') { if (b.l < a.r - 1) continue; along = b.l - a.r; across = Math.abs(b.cy - a.cy); }
        else if (dir === 'ArrowLeft') { if (b.r > a.l + 1) continue; along = a.l - b.r; across = Math.abs(b.cy - a.cy); }
        else if (dir === 'ArrowDown') { if (b.t < a.b - 1) continue; along = b.t - a.b; across = Math.abs(b.cx - a.cx); }
        else { if (b.b > a.t + 1) continue; along = a.t - b.b; across = Math.abs(b.cx - a.cx); }
        const s = along + across * 2.2;
        if (s < score) { score = s; winner = el; }
      }
      return winner;
    }

    function focus(el) {
      if (!el) return;
      tiles.forEach((t) => (t.tabIndex = -1));
      el.tabIndex = 0; el.focus();
      now.textContent = el.firstChild.textContent.trim() + ' selected';
    }

    grid.addEventListener('keydown', (e) => {
      if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
      const from = document.activeElement;
      if (!tiles.includes(from)) return;
      e.preventDefault();
      if (e.key === 'Home') return focus(tiles[0]);
      if (e.key === 'End') return focus(tiles[tiles.length - 1]);
      focus(best(from, e.key));
    });

    tiles.forEach((t) => t.addEventListener('focus', () => {
      tiles.forEach((o) => (o.tabIndex = o === t ? 0 : -1));
    }));
  });
})();
