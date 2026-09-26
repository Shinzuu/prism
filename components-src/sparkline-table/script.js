/* Sparklines drawn from a data attribute, and heat tints applied from another.
   Each row's spark is scaled to its own range, because a row whose values sit
   between 30 and 34 still has a shape worth seeing. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';

  document.querySelectorAll('[data-st]').forEach((table) => {
    table.querySelectorAll('td[data-heat]').forEach((td) => {
      td.style.setProperty('--h', td.dataset.heat);
      // Keep the figure above the wash without wrapping it by hand.
      if (td.firstChild?.nodeType === 3) {
        const s = document.createElement('span');
        s.textContent = td.textContent;
        td.textContent = ''; td.append(s);
      }
    });

    table.querySelectorAll('td[data-spark]').forEach((td) => {
      const vals = td.dataset.spark.split(',').map(Number).filter(Number.isFinite);
      if (vals.length < 2) return;
      const w = 100, h = 22, pad = 2;
      const min = Math.min(...vals), max = Math.max(...vals);
      const range = max - min || 1;                    // per-row scale, not global
      const x = (i) => (i / (vals.length - 1)) * w;
      const y = (v) => pad + (1 - (v - min) / range) * (h - pad * 2);

      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('aria-hidden', 'true');         // the row already states the figures

      const band = document.createElementNS(NS, 'path');
      band.setAttribute('class', 'sp__band');
      band.setAttribute('d', `M0,${h} ${vals.map((v, i) => `L${x(i)},${y(v)}`).join(' ')} L${w},${h} Z`);

      const line = document.createElementNS(NS, 'path');
      line.setAttribute('class', 'sp__line');
      line.setAttribute('d', vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' '));

      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('class', 'sp__last');
      dot.setAttribute('cx', x(vals.length - 1)); dot.setAttribute('cy', y(vals[vals.length - 1]));
      dot.setAttribute('r', '2.1');

      svg.append(band, line, dot);
      td.append(svg);

      // The shape is decoration; the trend is the fact. State it once, in text.
      const first = vals[0], last = vals[vals.length - 1];
      const pctChange = ((last - first) / (first || 1)) * 100;
      const dir = Math.abs(pctChange) < 2 ? 'flat' : pctChange > 0 ? 'rising' : 'falling';
      const sr = document.createElement('span');
      sr.className = 'st__sr';
      sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';
      sr.textContent = `${dir}, ${first} to ${last} over twelve hours`;
      td.append(sr);
    });
  });
})();
