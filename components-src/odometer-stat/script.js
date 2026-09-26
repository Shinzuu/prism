/* Odometer figures. Each digit is a window onto a 0-9 strip; only the strips
   whose digit actually changed are translated, so a figure that goes from
   1,284,697 to 1,284,712 moves three wheels, not seven. */
(() => {
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-od]').forEach((root) => {
    const figures = [...root.querySelectorAll('[data-od-value]')];

    function build(fig) {
      const sr = fig.querySelector('[data-od-sr]');
      const suffix = fig.dataset.odSuffix || '';
      fig.textContent = '';
      fig.append(sr);
      fig._cells = [];

      const digits = String(fig.dataset.odValue).split('');
      digits.forEach((d, i) => {
        // Thousands separators are their own inert cell, never a wheel.
        const fromEnd = digits.length - i;
        if (!suffix && fromEnd % 3 === 0 && i > 0) {
          const sep = document.createElement('span');
          sep.className = 'od__sep';
          sep.textContent = ',';
          fig.append(sep);
        }
        const cell = document.createElement('span');
        cell.className = 'od__digit';
        const strip = document.createElement('span');
        strip.className = 'od__strip';
        for (let n = 0; n <= 9; n++) {
          const s = document.createElement('span');
          s.textContent = n;
          strip.append(s);
        }
        cell.append(strip);
        fig.append(cell);
        fig._cells.push({ strip, digit: +d });
        strip.style.translate = `0 ${-d}em`;
      });

      if (suffix) {
        const s = document.createElement('span');
        s.className = 'od__suffix';
        s.textContent = suffix;
        fig.append(s);
      }
    }

    function roll(fig, next) {
      const suffix = fig.dataset.odSuffix || '';
      const target = String(next);
      // A different digit count means a different wheel count: rebuild.
      if (target.length !== String(fig.dataset.odValue).length) {
        fig.dataset.odValue = target;
        build(fig);
      } else {
        target.split('').forEach((d, i) => {
          const cell = fig._cells[i];
          if (!cell || cell.digit === +d) return;      // unchanged wheels stay still
          cell.digit = +d;
          cell.strip.style.translate = `0 ${-d}em`;
        });
        fig.dataset.odValue = target;
      }
      // One announcement of the final figure, not ten of the digits moving.
      const pretty = suffix ? target + suffix : (+target).toLocaleString();
      fig.querySelector('[data-od-sr]').textContent = pretty;
    }

    figures.forEach(build);

    root.querySelector('[data-od-roll]')?.addEventListener('click', () => {
      figures.forEach((fig) => {
        const cur = +fig.dataset.odValue;
        const drift = fig.dataset.odSuffix
          ? Math.max(8, Math.round(cur + (Math.random() * 30 - 14)))
          : cur + Math.round(Math.random() * 40000 + 2000);
        if (REDUCED) fig.querySelector('.od__strip')?.style.setProperty('transition', 'none');
        roll(fig, drift);
      });
    });
  });
})();
