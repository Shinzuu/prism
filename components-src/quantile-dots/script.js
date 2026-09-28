/* Quantile dotplot: one hundred outcomes drawn at evenly spaced quantiles, so
   probability is something you count rather than read off a shaded band. */
(() => {
  const N = 100;          // one dot per percentile keeps the count trivial
  const BINS = 20;

  // Inverse normal CDF (Acklam's rational approximation) — accurate enough to
  // place dots, and short enough to read.
  function probit(p) {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687,
               138.3577518672690, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866,
               66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838,
               -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const lo = 0.02425, hi = 1 - lo;
    let q, r;
    if (p < lo) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
    if (p > hi) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }

  document.querySelectorAll('[data-qd]').forEach((root) => {
    const plot = root.querySelector('[data-qd-plot]');
    const axis = root.querySelector('[data-qd-axis]');
    const read = root.querySelector('[data-qd-read]');
    const cut = root.querySelector('[data-qd-cut]');
    const out = root.querySelector('[data-qd-out]');
    const tbody = root.querySelector('[data-qd-table] tbody');

    const MU = 8.2, SD = 2.1;

    /* Dots sit at evenly spaced quantiles, not at random samples. Random
       sampling gives a different picture on every load and misrepresents the
       distribution at small n. */
    const values = Array.from({ length: N }, (_, i) => MU + SD * probit((i + 0.5) / N));
    const lo = values[0], hi = values[N - 1];
    const bins = Array.from({ length: BINS }, () => []);
    for (const v of values) {
      const b = Math.min(BINS - 1, Math.floor(((v - lo) / (hi - lo)) * BINS));
      bins[b].push(v);
    }

    const cols = bins.map((col) => {
      const el = document.createElement('div');
      el.className = 'qd__col';
      col.forEach((v) => {
        const d = document.createElement('span');
        d.className = 'qd__dot';
        d.dataset.v = v;
        el.append(d);
      });
      plot.append(el);
      return el;
    });

    axis.innerHTML = `<span>day ${Math.round(lo)}</span><span>${Math.round((lo + hi) / 2)}</span><span>day ${Math.round(hi)}</span>`;

    for (const q of [0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th scope="row">p${q * 100}</th><td>day ${(MU + SD * probit(q)).toFixed(1)}</td>`;
      tbody.append(tr);
    }

    function paint() {
      const at = +cut.value;
      let made = 0;
      for (const col of cols) {
        for (const dot of col.children) {
          const inTime = +dot.dataset.v <= at;
          dot.dataset.in = String(inTime);
          if (inTime) made++;
        }
      }
      out.textContent = 'day ' + at.toFixed(1);
      // The sentence is the component. The dots are how you check it.
      read.innerHTML = `<b>${made}</b> of ${N} outcomes arrive by day ${at.toFixed(1)}.`;
      plot.dataset.qdLabel = '';
      plot.setAttribute('aria-label',
        `Dotplot of 100 predicted outcomes. ${made} arrive by day ${at.toFixed(1)}, ${N - made} later.`);
    }

    cut.addEventListener('input', paint);
    paint();
  });
})();
