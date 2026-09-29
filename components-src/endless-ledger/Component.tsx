import { useEffect, useRef, useState } from 'react';

const ROWS = 50000;
const SYMBOLS = ['AIRF', 'HYDR', 'TURB', 'PYLN', 'RDME', 'NOZL', 'GLOV', 'STAB'];
/* Built once and reused. Number.prototype.toLocaleString() resolves a fresh
   formatter per call: 1,105ms across these rows against 26ms hoisted. */
const nf = new Intl.NumberFormat();

/* Short, scoped class names on the repeated rows. Utility classes are written
   once per element, and at 50,000 rows that is 50,000 copies of the same
   string: measured, per-row Tailwind classes cost 6,120ms to first paint
   against 1,731ms for one scoped class. Utilities are right for a component
   written once; they are the wrong unit for a row emitted fifty thousand
   times. */

export default function EndlessLedger() {
  const [html, setHtml] = useState('');
  const [paint, setPaint] = useState('measuring…');
  const t0 = useRef(0);

  useEffect(() => {
    let cancelled = false;
    /* Wait for fonts before starting the clock. Otherwise the paint callback
       queues behind a 3.5s font fetch and the figure reports the network
       rather than the rows — which would make the component's one claim a lie
       in the direction that flatters it. */
    const go = () => {
      if (cancelled) return;
      t0.current = performance.now();
      const parts = new Array<string>(ROWS);
      for (let i = 0; i < ROWS; i++) {
        const sell = (i * 7 + 3) % 5 === 0;
        parts[i] =
          '<div role="row" aria-rowindex="' + (i + 1) + '" class="el-row">' +
          '<span role="cell" class="el-n">' + (i + 1) + '</span>' +
          '<span role="cell">' + SYMBOLS[i % SYMBOLS.length] + '</span>' +
          '<span role="cell"' + (sell ? ' class="el-sell"' : '') + '>' + (sell ? 'sell' : 'buy') + '</span>' +
          '<span role="cell" class="el-num">' + nf.format(25 + ((i * 37) % 4000)) + '</span>' +
          '<span role="cell" class="el-num">' + (80 + ((i * 13) % 5000) / 100).toFixed(2) + '</span>' +
          '</div>';
      }
      setHtml(parts.join(''));
    };
    if (document.fonts?.ready) document.fonts.ready.then(go); else go();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!html) return;
    // Measure after the browser has actually painted, not after the loop.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPaint(`${Math.round(performance.now() - t0.current)}ms to first paint`))
    );
  }, [html]);

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 text-[.86rem] font-medium">Trade ledger</p>
        <p className="m-0 font-mono text-[.7rem] tabular-nums text-text-dim">
          {nf.format(ROWS)} rows<span className="mx-1.5 opacity-50">·</span>{paint}
        </p>
      </div>

      {/* ARIA grid roles, not a <table>. A table box builds its own row grid by
          walking every row, so per-row containment cannot save it: measured at
          50,000 rows, 3,367ms in layout as a table against 434ms as div rows. */}
      {/* The scroller wraps the table rather than sitting inside it. A table's
          children must be rows or rowgroups, and an intervening scroll box is
          neither — it breaks the chain between the table and its rows, and a
          role="presentation" cannot repair it because this element is
          focusable and labelled, which makes that role be ignored. The header
          still sticks: sticky resolves against the nearest scrolling ancestor,
          which is this element either way. */}
      <div tabIndex={0} role="region" aria-label="Ledger rows"
           className="h-[210px] overflow-y-auto rounded-[9px] border border-border bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        <div role="table" aria-rowcount={ROWS} aria-label="Trade ledger" className="text-[.78rem]">
          <div role="row" className="el-row sticky top-0 z-10 !border-b-border bg-raised text-[.7rem] text-text-dim">
            {['#', 'Instrument', 'Side', 'Qty', 'Price'].map((h, i) => (
              <span key={h} role="columnheader" className={i >= 3 ? 'el-num' : undefined}>{h}</span>
            ))}
          </div>
          <div role="rowgroup" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

      <p className="m-0 text-[.72rem] text-text-dim">
        Fifty thousand real rows. No virtualization library, no windowing, no scroll listener. The
        figure is measured after fonts settle, so it reports the rows rather than the network.
      </p>
    </div>
  );
}
