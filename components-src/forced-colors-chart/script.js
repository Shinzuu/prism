/* A chart that survives colour being taken away. Windows High Contrast and
   forced-colors: active replace every colour on the page with a user-chosen
   pair, so four lines distinguished only by hue become four identical lines.
   Dash pattern and marker shape carry the identity instead — always, not as a
   fallback, because an encoding that only appears in high contrast is an
   encoding nobody has ever tested. */
(() => {
  const SERIES = [
    { name: 'us-east',    dash: 'none',   marker: 0, data: [4.1, 3.8, 3.9, 3.2, 2.8, 2.9, 2.4, 2.2, 2.3, 1.9, 1.7, 1.6] },
    { name: 'eu-central', dash: '5 3',    marker: 1, data: [2.2, 2.4, 2.1, 2.6, 2.9, 3.4, 3.1, 3.6, 3.9, 4.2, 4.0, 4.4] },
    { name: 'ap-south',   dash: '2 2',    marker: 2, data: [5.4, 5.1, 4.6, 4.9, 4.2, 3.8, 3.9, 3.3, 3.0, 3.1, 2.7, 2.5] },
    { name: 'sa-east',    dash: '7 2 2 2', marker: 3, data: [1.4, 1.6, 1.9, 1.7, 2.1, 2.0, 2.4, 2.2, 2.6, 2.5, 2.9, 3.1] },
  ];
  const NS = 'http://www.w3.org/2000/svg';
  const W = 320, H = 120, PAD = 10, MAX = 6;

  document.querySelectorAll('[data-fc]').forEach((root) => {
    const g = root.querySelector('[data-fc-series]');
    const legend = root.querySelector('[data-fc-legend]');
    const table = root.querySelector('[data-fc-table]');
    const sim = root.querySelector('[data-fc-sim]');

    const x = (i) => PAD + (i / 11) * (W - PAD * 2);
    const y = (v) => H - PAD - (v / MAX) * (H - PAD * 2);

    SERIES.forEach((s, si) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('class', 'fc__line');
      path.setAttribute('d', s.data.map((v, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(v)).join(' '));
      path.setAttribute('stroke', 'var(--accent)');
      // Hue rotates per series only as a convenience; the dash is the identity.
      path.style.stroke = 'oklch(from var(--accent) l c calc(h + ' + si * 62 + '))';
      if (s.dash !== 'none') path.setAttribute('stroke-dasharray', s.dash);
      g.append(path);

      s.data.forEach((v, i) => {
        if (i % 3 !== 0 && i !== 11) return;   // markers every third point
        const use = document.createElementNS(NS, 'use');
        use.setAttribute('href', '#fc-m' + s.marker);
        use.setAttribute('class', 'fc__mark');
        use.setAttribute('x', x(i)); use.setAttribute('y', y(v));
        use.style.fill = 'oklch(from var(--accent) l c calc(h + ' + si * 62 + '))';
        g.append(use);
      });

      const li = document.createElement('li');
      li.className = 'fc__leg';
      li.innerHTML =
        '<svg class="fc__legsvg" viewBox="-6 -6 12 12" aria-hidden="true">' +
        '<use href="#fc-m' + s.marker + '" style="fill:oklch(from var(--accent) l c calc(h + ' + si * 62 + '))"/></svg>' +
        '<span class="fc__swatch" style="border-top-style:' +
          (s.dash === 'none' ? 'solid' : s.dash === '2 2' ? 'dotted' : 'dashed') +
          ';border-top-color:oklch(from var(--accent) l c calc(h + ' + si * 62 + '))"></span>' +
        '<span>' + s.name + '</span>';
      legend.append(li);
    });

    table.innerHTML =
      '<tr><th>region</th>' + SERIES[0].data.map((_, i) => '<th>w' + (i + 1) + '</th>').join('') + '</tr>' +
      SERIES.map((s) => '<tr><td>' + s.name + '</td>' +
        s.data.map((v) => '<td>' + v.toFixed(1) + '</td>').join('') + '</tr>').join('');

    sim.addEventListener('click', () => {
      const on = root.hasAttribute('data-fc-forced');
      sim.setAttribute('aria-pressed', String(!on));
      if (on) root.removeAttribute('data-fc-forced'); else root.dataset.fcForced = '';
    });

    // If the user is already in forced colors, say so rather than offering to fake it.
    if (matchMedia('(forced-colors: active)').matches) {
      sim.disabled = true;
      sim.textContent = 'forced colors is already on';
    }
  });
})();
