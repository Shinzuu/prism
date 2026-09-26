/* Cron builder. Nobody writes cron correctly first time, so the component's
   job is to answer the only question that matters: when will this actually
   fire? It computes the next five occurrences instead of describing the syntax. */
(() => {
  const RANGES = { min: [0, 59], hour: [0, 23], dom: [1, 31], mon: [1, 12], dow: [0, 6] };
  const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function expand(field, [lo, hi]) {
    const out = new Set();
    for (const part of field.split(',')) {
      const m = /^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part.trim());
      if (!m) return null;
      const step = m[3] ? +m[3] : 1;
      if (step < 1) return null;
      let a, b;
      if (m[1] === '*') { a = lo; b = hi; }
      else { a = +m[1]; b = m[2] !== undefined ? +m[2] : (m[3] ? hi : a); }
      if (a < lo || b > hi || a > b) return null;
      for (let v = a; v <= b; v += step) out.add(v);
    }
    return out.size ? [...out].sort((x, y) => x - y) : null;
  }

  function describe(sets, raw) {
    const every = (k) => raw[k].trim() === '*';
    const list = (arr, names) => {
      const s = names ? arr.map((i) => names[i]) : arr.map(String);
      return s.length === 1 ? s[0] : s.slice(0, -1).join(', ') + ' and ' + s[s.length - 1];
    };
    const time = every('min') ? 'every minute' :
      sets.min.length > 4 ? `${sets.min.length} times an hour` : `at minute ${list(sets.min)}`;
    const hours = every('hour') ? 'of every hour' : `past hour ${list(sets.hour)}`;
    const days = every('dow') ? (every('dom') ? 'every day' : `on day ${list(sets.dom)} of the month`)
                              : `on ${list(sets.dow, DOW)}`;
    const months = every('mon') ? '' : `, in ${list(sets.mon, MON)}`;
    return `Runs ${time} ${hours}, ${days}${months}.`;
  }

  function nextRuns(sets, from, n) {
    const out = [];
    const d = new Date(from); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
    // Walk minute by minute with a hard ceiling; a cron that cannot fire
    // within four years does not fire, and must be reported rather than hang.
    const limit = 60 * 24 * 366 * 4;
    for (let i = 0; i < limit && out.length < n; i++) {
      if (sets.mon.includes(d.getMonth() + 1) &&
          sets.dom.includes(d.getDate()) &&
          sets.dow.includes(d.getDay()) &&
          sets.hour.includes(d.getHours()) &&
          sets.min.includes(d.getMinutes())) {
        out.push(new Date(d));
      }
      d.setMinutes(d.getMinutes() + 1);
    }
    return out;
  }

  document.querySelectorAll('[data-cb]').forEach((root) => {
    const inputs = [...root.querySelectorAll('[data-cb-f]')];
    const expr = root.querySelector('[data-cb-expr]');
    const says = root.querySelector('[data-cb-says]');
    const list = root.querySelector('[data-cb-list]');
    const tz = root.querySelector('[data-cb-tz]');
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    tz.textContent = '(' + Intl.DateTimeFormat().resolvedOptions().timeZone + ')';

    function review() {
      const raw = Object.fromEntries(inputs.map((i) => [i.dataset.cbF, i.value]));
      expr.textContent = ['min','hour','dom','mon','dow'].map((k) => raw[k].trim() || '*').join(' ');

      const sets = {}; let bad = false;
      for (const k of Object.keys(RANGES)) {
        const s = expand(raw[k].trim() || '*', RANGES[k]);
        const input = inputs.find((i) => i.dataset.cbF === k);
        input.setAttribute('aria-invalid', String(s === null));
        if (s === null) bad = true; else sets[k] = s;
      }

      list.textContent = '';
      if (bad) {
        says.dataset.bad = 'true';
        says.textContent = 'One of these fields is not valid cron, so there is nothing to predict.';
        return;
      }
      says.dataset.bad = 'false';
      says.textContent = describe(sets, raw);

      const runs = nextRuns(sets, new Date(), 5);
      if (!runs.length) {
        const li = document.createElement('li');
        li.textContent = 'Never — no date in the next four years matches.';
        list.append(li);
        return;
      }
      for (const r of runs) {
        const li = document.createElement('li');
        li.textContent = fmt.format(r);
        list.append(li);
      }
    }

    inputs.forEach((i) => i.addEventListener('input', review));
    review();
  });
})();
