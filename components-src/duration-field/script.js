/* Duration input that accepts how people actually write durations, then shows
   what it understood. The parse is the component; the field is incidental. */
(() => {
  const UNITS = { d: 86400, h: 3600, m: 60, s: 1 };

  function parse(raw) {
    const s = raw.trim().toLowerCase();
    if (!s) return null;

    // Clock form: 1:30 is an hour and a half, 1:30:05 adds seconds.
    const clock = /^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/.exec(s);
    if (clock) {
      return (+clock[1]) * 3600 + (+clock[2]) * 60 + (+(clock[3] || 0));
    }

    // Unit form: "2h30", "2h 30m", "1d4h", "90m", "45s".
    const re = /(\d+(?:\.\d+)?)\s*(d|h|m|s|days?|hours?|mins?|minutes?|secs?|seconds?)?/g;
    let total = 0, seen = 0, m, lastUnit = null, trailingBare = false;
    while ((m = re.exec(s)) !== null) {
      if (!m[0].trim()) continue;
      const n = parseFloat(m[1]);
      let u = (m[2] || '')[0];
      if (!u) {
        // A bare number after a unit inherits the next smaller one: 2h30 is
        // two hours thirty minutes, which is how people write it.
        if (lastUnit === 'd') u = 'h';
        else if (lastUnit === 'h') u = 'm';
        else if (lastUnit === 'm') u = 's';
        else { u = 'm'; trailingBare = true; }   // a bare number alone means minutes
      }
      if (!(u in UNITS)) return null;
      total += n * UNITS[u];
      lastUnit = u; seen++;
    }
    if (!seen) return null;
    void trailingBare;
    return Math.round(total);
  }

  function format(total) {
    if (total === 0) return '0s';
    const parts = [];
    let left = total;
    for (const [u, size] of Object.entries(UNITS)) {
      const n = Math.floor(left / size);
      if (n) { parts.push(n + u); left -= n * size; }
    }
    return parts.join(' ');
  }

  function words(total) {
    const d = Math.floor(total / 86400), h = Math.floor(total % 86400 / 3600);
    const m = Math.floor(total % 3600 / 60), s = total % 60;
    const bits = [];
    if (d) bits.push(d + (d === 1 ? ' day' : ' days'));
    if (h) bits.push(h + (h === 1 ? ' hour' : ' hours'));
    if (m) bits.push(m + (m === 1 ? ' minute' : ' minutes'));
    if (s) bits.push(s + (s === 1 ? ' second' : ' seconds'));
    return bits.join(', ');
  }

  document.querySelectorAll('[data-df]').forEach((root) => {
    const input = root.querySelector('.df__input');
    const norm = root.querySelector('[data-df-norm]');

    function review() {
      const total = parse(input.value);
      const bad = total === null;
      input.setAttribute('aria-invalid', String(bad));
      norm.dataset.bad = String(bad);
      norm.textContent = bad
        ? 'Not a duration yet.'
        : format(total) + ' · ' + words(total) + ' · ' + total + 's';
    }

    input.addEventListener('input', review);
    // Normalise only on blur, never mid-keystroke.
    input.addEventListener('blur', () => {
      const total = parse(input.value);
      if (total !== null) input.value = format(total);
      review();
    });
    input.addEventListener('keydown', (e) => {
      const total = parse(input.value);
      if (total === null) return;
      const step = e.shiftKey ? 3600 : e.altKey ? 1 : 60;
      if (e.key === 'ArrowUp') { e.preventDefault(); input.value = format(total + step); review(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); input.value = format(Math.max(0, total - step)); review(); }
    });
    review();
  });
})();
