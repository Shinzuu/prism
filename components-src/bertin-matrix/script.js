/* Bertin's reorderable matrix. The data never changes — the ROWS and COLUMNS
   move. Sorting one axis alone cannot reveal structure in a matrix, because
   the pattern lives in the pairing of both; permuting both until similar rows
   and similar columns sit together drags the structure onto the diagonal. */
(() => {
  const TEAMS = ['Payments', 'Growth', 'Platform', 'Support', 'Data', 'Mobile', 'Security', 'Docs'];
  const FEATS = ['Audit log', 'Webhooks', 'SSO', 'Exports', 'Sandbox', 'Alerts', 'API keys', 'Dashboards', 'Roles'];

  /* Planted block structure, then shuffled. Without a real structure to find,
     any reordering looks equally good and the component proves nothing. */
  const BLOCKS = [
    { teams: [0, 2, 6], feats: [0, 2, 6, 8] },
    { teams: [1, 4, 7], feats: [3, 5, 7] },
    { teams: [3, 5], feats: [1, 4] },
  ];

  document.querySelectorAll('[data-bm]').forEach((root) => {
    const table = root.querySelector('[data-bm-grid]');
    const read = root.querySelector('[data-bm-read]');
    const go = root.querySelector('[data-bm-go]');

    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    const M = TEAMS.map((_, r) => FEATS.map((_, c) => {
      const inBlock = BLOCKS.some((b) => b.teams.includes(r) && b.feats.includes(c));
      return Math.round(inBlock ? 55 + rnd() * 45 : rnd() * 28);
    }));

    // Start deliberately scrambled.
    let rowOrder = TEAMS.map((_, i) => i).sort(() => rnd() - 0.5);
    let colOrder = FEATS.map((_, i) => i).sort(() => rnd() - 0.5);

    const render = () => {
      table.replaceChildren();
      const head = document.createElement('thead');
      const hr = document.createElement('tr');
      hr.append(document.createElement('th'));
      for (const c of colOrder) {
        const th = document.createElement('th');
        th.scope = 'col'; th.textContent = FEATS[c];
        hr.append(th);
      }
      head.append(hr); table.append(head);

      const body = document.createElement('tbody');
      for (const r of rowOrder) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row'; th.textContent = TEAMS[r];
        tr.append(th);
        for (const c of colOrder) {
          const td = document.createElement('td');
          const d = document.createElement('div');
          d.className = 'bm__c';
          d.style.setProperty('--bm-v', M[r][c]);
          // A colour block is invisible to assistive tech; the number is not.
          d.setAttribute('role', 'img');
          d.setAttribute('aria-label', TEAMS[r] + ' × ' + FEATS[c] + ': ' + M[r][c]);
          td.append(d); tr.append(td);
        }
        body.append(tr);
      }
      table.append(body);
    };

    /* Score: how much of the total weight sits near the diagonal. Rising score
       means structure is being pulled together rather than scattered. */
    const score = () => {
      let s = 0;
      rowOrder.forEach((r, i) => colOrder.forEach((c, j) => {
        const dist = Math.abs(i / (rowOrder.length - 1) - j / (colOrder.length - 1));
        s += M[r][c] * (1 - dist);
      }));
      return Math.round(s);
    };

    /* Bertin's own method, mechanised: repeatedly order each axis by the
       weighted mean position of its mass on the other axis. Two or three
       passes converge — this is the barycentre heuristic. */
    const reorder = () => {
      for (let pass = 0; pass < 4; pass++) {
        const rowBary = rowOrder.map((r) => {
          let num = 0, den = 0;
          colOrder.forEach((c, j) => { num += M[r][c] * j; den += M[r][c]; });
          return { r, b: den ? num / den : 0 };
        });
        rowOrder = rowBary.sort((a, b) => a.b - b.b).map((x) => x.r);

        const colBary = colOrder.map((c) => {
          let num = 0, den = 0;
          rowOrder.forEach((r, i) => { num += M[r][c] * i; den += M[r][c]; });
          return { c, b: den ? num / den : 0 };
        });
        colOrder = colBary.sort((a, b) => a.b - b.b).map((x) => x.c);
      }
    };

    go.addEventListener('click', () => {
      const was = score();
      reorder();
      render();
      read.textContent = 'diagonal concentration ' + was + ' → ' + score() + ' · same values, permuted axes';
    });

    render();
    read.textContent = 'diagonal concentration ' + score() + ' · scrambled';
  });
})();
