/* Working-hours bands across timezones, over a week that contains a DST
   transition. The point is the jog: on 26 October Europe leaves summer time
   and the US does not, so an overlap that held all year silently moves by an
   hour mid-week. Computing with fixed UTC offsets cannot show this, because a
   fixed offset is exactly the assumption that breaks. */
(() => {
  const PEOPLE = [
    { name: 'Lisbon',   tz: 'Europe/Lisbon',     start: 9, end: 18 },
    { name: 'Berlin',   tz: 'Europe/Berlin',     start: 9, end: 17 },
    { name: 'New York', tz: 'America/New_York',  start: 9, end: 17 },
    { name: 'Mumbai',   tz: 'Asia/Kolkata',      start: 10, end: 19 },
  ];
  const DAYS = 7;
  const START = Date.UTC(2026, 9, 24);   // Sat 24 Oct 2026

  /* The offset must be asked for PER INSTANT, not once. Intl gives it via the
     formatted parts of that moment in that zone — the only correct source,
     because the rules change on dates that differ per country. */
  const offsetAt = (tz, date) => {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
    return (asUTC - date.getTime()) / 3600000;
  };

  document.querySelectorAll('[data-zor]').forEach((root) => {
    const grid = root.querySelector('[data-zor-grid]');
    const read = root.querySelector('[data-zor-read]');
    const note = root.querySelector('[data-zor-note]');

    // For each UTC hour of the week, who is working?
    const HOURS = DAYS * 24;
    const busy = PEOPLE.map(() => new Array(HOURS).fill(false));
    const offsets = PEOPLE.map(() => new Set());

    for (let h = 0; h < HOURS; h++) {
      const at = new Date(START + h * 3600000);
      PEOPLE.forEach((p, i) => {
        const off = offsetAt(p.tz, at);
        offsets[i].add(off);
        const localHour = ((h + off) % 24 + 24) % 24;
        const localDay = Math.floor((h + off) / 24);
        const weekday = new Date(START + localDay * 86400000).getUTCDay();
        const isWeekend = weekday === 0 || weekday === 6;
        busy[i][h] = !isWeekend && localHour >= p.start && localHour < p.end;
      });
    }

    const overlap = new Array(HOURS).fill(false)
      .map((_, h) => PEOPLE.every((_, i) => busy[i][h]));

    const lane = (flags, cls, shiftHours) => {
      const l = document.createElement('div');
      l.className = 'zor__lane';
      let h = 0;
      while (h < HOURS) {
        if (!flags[h]) { h++; continue; }
        let end = h;
        while (end < HOURS && flags[end]) end++;
        const b = document.createElement('div');
        b.className = 'zor__band' + (cls ? ' ' + cls : '');
        b.style.insetInlineStart = (h / HOURS * 100) + '%';
        b.style.width = ((end - h) / HOURS * 100) + '%';
        if (shiftHours && shiftHours.has(h)) b.dataset.shift = '';
        l.append(b);
        h = end;
      }
      return l;
    };

    PEOPLE.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'zor__row';
      const who = document.createElement('span');
      who.className = 'zor__who';
      const offs = [...offsets[i]].sort((a, b) => a - b);
      who.textContent = p.name + (offs.length > 1 ? ' ⤯' : '');
      who.title = p.tz + ' · UTC' + offs.map((o) => (o >= 0 ? '+' : '') + o).join(' → ');
      row.append(who, lane(busy[i], '', null));
      grid.append(row);
    });

    const all = document.createElement('div');
    all.className = 'zor__row';
    const lbl = document.createElement('span');
    lbl.className = 'zor__who'; lbl.textContent = 'all four';
    all.append(lbl, lane(overlap, 'zor__all', null));
    grid.append(all);

    const hours = overlap.filter(Boolean).length;
    const shifted = PEOPLE.filter((_, i) => offsets[i].size > 1).map((p) => p.name);
    read.textContent = hours + ' overlapping hours this week';
    note.textContent = shifted.length
      ? shifted.join(' and ') + ' changed UTC offset mid-week (⤯), so the overlap moves by an hour partway through — a fixed-offset calculation shows a straight band and is wrong after the transition.'
      : 'No offset change this week.';
  });
})();
