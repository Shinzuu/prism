/* Ridgeline plot: stacked density curves that overlap. Well understood in
   statistics, essentially unseen in product UI, and the right shape whenever
   you need to compare distributions rather than totals. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const SERIES = [
    { name: '1.4.2', mu: 62, sd: 11, hot: false },
    { name: '1.4.1', mu: 68, sd: 14, hot: false },
    { name: '1.4.0', mu: 96, sd: 31, hot: true },
    { name: '1.3.9', mu: 71, sd: 16, hot: false },
    { name: '1.3.8', mu: 66, sd: 13, hot: false }
  ];
  const LO = 20, HI = 190, STEPS = 64;

  const density = (x, mu, sd) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));

  document.querySelectorAll('[data-rp]').forEach((root) => {
    const plot = root.querySelector('[data-rp-plot]');
    const tbody = root.querySelector('[data-rp-table] tbody');

    // One shared vertical scale across every ridge, or the heights lie.
    let peak = 0;
    for (const s of SERIES) peak = Math.max(peak, density(s.mu, s.mu, s.sd));

    SERIES.forEach((s) => {
      const row = document.createElement('div');
      row.className = 'rp__row';
      row.dataset.hot = String(s.hot);

      const name = document.createElement('span');
      name.className = 'rp__name';
      name.textContent = s.name;

      const w = 300, h = 54;
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'rp__curve');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');

      let d = `M0,${h}`;
      for (let i = 0; i <= STEPS; i++) {
        const x = LO + (i / STEPS) * (HI - LO);
        const y = h - (density(x, s.mu, s.sd) / peak) * (h - 2);
        d += ` L${((x - LO) / (HI - LO)) * w},${y}`;
      }
      d += ` L${w},${h} Z`;

      const area = document.createElementNS(NS, 'path');
      area.setAttribute('class', 'rp__area');
      area.setAttribute('d', d);

      const med = document.createElementNS(NS, 'line');
      med.setAttribute('class', 'rp__med');
      const mx = ((s.mu - LO) / (HI - LO)) * w;
      med.setAttribute('x1', mx); med.setAttribute('x2', mx);
      med.setAttribute('y1', h); med.setAttribute('y2', h - (density(s.mu, s.mu, s.sd) / peak) * (h - 2));

      svg.append(area, med);
      row.append(name, svg);
      plot.append(row);

      const tr = document.createElement('tr');
      tr.innerHTML = `<th scope="row">${s.name}</th><td>${s.mu} ms</td><td>±${s.sd} ms</td>`;
      tbody.append(tr);
    });

    const axis = document.createElement('div');
    axis.className = 'rp__axis';
    axis.innerHTML = `<span></span><span class="rp__ticks"><span>${LO}</span><span>${Math.round((LO+HI)/2)}</span><span>${HI} ms</span></span>`;
    plot.after(axis);
  });
})();
