/* Fifty thousand rows, rendered once. The scrolling performance is not from
   JavaScript — it is content-visibility on each row. This file only builds the
   data and reports how long the first paint actually took. */
(() => {
  const ROWS = 50000;
  const SYMBOLS = ['AIRF', 'HYDR', 'TURB', 'PYLN', 'RDME', 'NOZL', 'GLOV', 'STAB'];

  /* Built once and reused. Number.prototype.toLocaleString() resolves a fresh
     formatter per call: 1,105ms across these rows, against 26ms when the
     Intl.NumberFormat is hoisted out of the loop. */
  const nf = new Intl.NumberFormat();

  document.querySelectorAll('[data-el]').forEach((root) => {
    const body = root.querySelector('[data-el-body]');
    const count = root.querySelector('[data-el-count]');
    const paint = root.querySelector('[data-el-paint]');

    const t0 = performance.now();

    // One string, parsed once. 250,000 createElement calls cost far more.
    const parts = new Array(ROWS);
    for (let i = 0; i < ROWS; i++) {
      const sell = (i * 7 + 3) % 5 === 0;
      const side = sell ? 'sell' : 'buy';
      const qty = 25 + ((i * 37) % 4000);
      const price = (80 + ((i * 13) % 5000) / 100).toFixed(2);
      parts[i] = '<div class="el__row el__body-row" role="row" data-side="' + side +
        '" aria-rowindex="' + (i + 1) + '"><span role="cell">' + (i + 1) +
        '</span><span role="cell">' + SYMBOLS[i % SYMBOLS.length] +
        '</span><span role="cell">' + side +
        '</span><span role="cell">' + nf.format(qty) +
        '</span><span role="cell">' + price + '</span></div>';
    }
    body.innerHTML = parts.join('');

    count.textContent = ROWS.toLocaleString() + ' rows';

    // Measure after the browser has actually painted, not after the loop.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      paint.textContent = Math.round(performance.now() - t0) + 'ms to first paint';
    }));
  });
})();
