/* A year of daily values in one block. The interesting part is not the colours:
   it is that arrow keys move by day and by week through a grid whose DOM order
   is columns, so Down is +1 in the DOM but Right is +7. */
(() => {
  const WEEKS = 26, DAYS = 7;
  const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  document.querySelectorAll('[data-hc]').forEach((root) => {
    const grid = root.querySelector('[data-hc-grid]');
    const read = root.querySelector('[data-hc-read]');
    const sum = root.querySelector('[data-hc-sum]');
    const cells = [];
    let total = 0;

    const end = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end); start.setDate(end.getDate() - (WEEKS * DAYS - 1));

    for (let i = 0; i < WEEKS * DAYS; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const seed = (d.getDate() * 7 + d.getMonth() * 13) % 11;
      const n = d.getDay() === 0 || d.getDay() === 6 ? Math.max(0, seed - 7) : Math.max(0, seed - 2);
      total += n;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hc__cell';
      b.dataset.lvl = n === 0 ? 0 : n < 3 ? 1 : n < 5 ? 2 : n < 7 ? 3 : 4;
      b.setAttribute('role', 'gridcell');
      b.tabIndex = i === WEEKS * DAYS - 1 ? 0 : -1;
      b.setAttribute('aria-label', `${n} ${n === 1 ? 'deploy' : 'deploys'} on ${fmt.format(d)}`);
      b._n = n; b._d = d;
      grid.append(b); cells.push(b);
    }
    sum.textContent = total.toLocaleString() + ' total';

    function focusAt(i) {
      if (i < 0 || i >= cells.length) return;
      cells.forEach((c) => (c.tabIndex = -1));
      cells[i].tabIndex = 0; cells[i].focus();
      read.textContent = cells[i].getAttribute('aria-label');
    }

    grid.addEventListener('keydown', (e) => {
      const i = cells.indexOf(document.activeElement);
      if (i < 0) return;
      // DOM order runs down each week column, so a day is ±1 and a week is ±7.
      const map = { ArrowDown: 1, ArrowUp: -1, ArrowRight: DAYS, ArrowLeft: -DAYS,
                    Home: -(i % DAYS), End: DAYS - 1 - (i % DAYS) };
      if (!(e.key in map)) return;
      e.preventDefault();
      focusAt(e.key === 'Home' || e.key === 'End' ? i + map[e.key] : i + map[e.key]);
    });

    cells.forEach((c, i) => c.addEventListener('click', () => focusAt(i)));
  });
})();
