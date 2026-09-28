import { useMemo, useState } from 'react';

const TEAMS = ['Payments', 'Growth', 'Platform', 'Support', 'Data', 'Mobile', 'Security', 'Docs'];
const FEATS = ['Audit log', 'Webhooks', 'SSO', 'Exports', 'Sandbox', 'Alerts', 'API keys', 'Dashboards', 'Roles'];
/* Planted block structure, then shuffled. Without a real structure to find,
   every permutation looks equally good and the component proves nothing. */
const BLOCKS = [
  { teams: [0, 2, 6], feats: [0, 2, 6, 8] },
  { teams: [1, 4, 7], feats: [3, 5, 7] },
  { teams: [3, 5], feats: [1, 4] },
];

function build() {
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const M = TEAMS.map((_, r) => FEATS.map((_, c) => {
    const inBlock = BLOCKS.some((b) => b.teams.includes(r) && b.feats.includes(c));
    return Math.round(inBlock ? 55 + rnd() * 45 : rnd() * 28);
  }));
  const rows = TEAMS.map((_, i) => i).sort(() => rnd() - 0.5);
  const cols = FEATS.map((_, i) => i).sort(() => rnd() - 0.5);
  return { M, rows, cols };
}

export default function BertinMatrix() {
  const { M, rows: r0, cols: c0 } = useMemo(build, []);
  const [rowOrder, setRowOrder] = useState(r0);
  const [colOrder, setColOrder] = useState(c0);
  const [read, setRead] = useState('');

  /* How much of the total weight sits near the diagonal. A rising score means
     structure is being pulled together rather than scattered. */
  const score = (ro: number[], co: number[]) => {
    let s = 0;
    ro.forEach((r, i) => co.forEach((c, j) => {
      const dist = Math.abs(i / (ro.length - 1) - j / (co.length - 1));
      s += M[r]![c]! * (1 - dist);
    }));
    return Math.round(s);
  };

  /* Bertin's own method: order each axis by the weighted mean position of its
     mass on the other, ALTERNATING to convergence. One pass of each is not
     enough — reordering the columns changes what "similar" means for the rows. */
  const reorder = () => {
    const was = score(rowOrder, colOrder);
    let ro = [...rowOrder], co = [...colOrder];
    for (let pass = 0; pass < 4; pass++) {
      ro = ro.map((r) => {
        let num = 0, den = 0;
        co.forEach((c, j) => { num += M[r]![c]! * j; den += M[r]![c]!; });
        return { r, b: den ? num / den : 0 };
      }).sort((a, b) => a.b - b.b).map((x) => x.r);
      co = co.map((c) => {
        let num = 0, den = 0;
        ro.forEach((r, i) => { num += M[r]![c]! * i; den += M[r]![c]!; });
        return { c, b: den ? num / den : 0 };
      }).sort((a, b) => a.b - b.b).map((x) => x.c);
    }
    setRowOrder(ro); setColOrder(co);
    setRead(`diagonal concentration ${was} → ${score(ro, co)} · same values, permuted axes`);
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">
          Feature use by team <span className="font-normal text-text-dim">— same data, reordered</span>
        </p>
        <button type="button" onClick={reorder}
          className="cursor-pointer rounded-md border border-border bg-raised px-[10px] py-[5px] font-sans text-[.7rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
          Reorder both axes
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-[.66rem]">
          <thead>
            <tr>
              <th />
              {colOrder.map((c) => (
                <th key={c} scope="col" className="bm-vert h-[4.6rem] whitespace-nowrap px-0.5 py-1 text-start font-normal font-mono text-[.6rem] text-text-dim">
                  {FEATS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowOrder.map((r) => (
              <tr key={r}>
                <th scope="row" className="whitespace-nowrap px-[5px] py-[3px] text-end font-normal font-mono text-[.6rem] text-text-dim">
                  {TEAMS[r]}
                </th>
                {colOrder.map((c) => (
                  <td key={c} className="p-0">
                    {/* A colour block is invisible to assistive tech; the label is not. */}
                    <div
                      role="img"
                      aria-label={`${TEAMS[r]} × ${FEATS[c]}: ${M[r]![c]}`}
                      className="bm-cell h-[17px] w-[17px] rounded-sm"
                      style={{ background: `color-mix(in oklab, var(--accent) ${M[r]![c]}%, transparent)` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p aria-live="polite" className="m-0 font-mono text-[.64rem] text-text-dim">
        {read || `diagonal concentration ${score(rowOrder, colOrder)} · scrambled`}
      </p>
    </div>
  );
}
