import { useMemo, useState } from 'react';

/** Rows and columns that belong together; the demo data is planted around these. */
export type Block = { teams: number[]; feats: number[] };

const DEFAULT_TEAMS = ['Payments', 'Growth', 'Platform', 'Support', 'Data', 'Mobile', 'Security', 'Docs'];
const DEFAULT_FEATS = ['Audit log', 'Webhooks', 'SSO', 'Exports', 'Sandbox', 'Alerts', 'API keys', 'Dashboards', 'Roles'];
/* Planted block structure, then shuffled. Without a real structure to find,
   every permutation looks equally good and the component proves nothing. */
const DEFAULT_BLOCKS: Block[] = [
  { teams: [0, 2, 6], feats: [0, 2, 6, 8] },
  { teams: [1, 4, 7], feats: [3, 5, 7] },
  { teams: [3, 5], feats: [1, 4] },
];

function build(teams: string[], feats: string[], blocks: Block[], seed: number, values?: number[][]) {
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const M = values ?? teams.map((_, r) => feats.map((_, c) => {
    const inBlock = blocks.some((b) => b.teams.includes(r) && b.feats.includes(c));
    return Math.round(inBlock ? 55 + rnd() * 45 : rnd() * 28);
  }));
  const rows = teams.map((_, i) => i).sort(() => rnd() - 0.5);
  const cols = feats.map((_, i) => i).sort(() => rnd() - 0.5);
  return { M, rows, cols };
}

export interface BertinMatrixProps {
  /** Row labels, top to bottom before shuffling. */
  rowLabels?: string[];
  /** Column labels, left to right before shuffling. */
  colLabels?: string[];
  /** Cell values 0–100 as [row][col]; when omitted, demo values are planted around `blocks`. */
  values?: number[][];
  /** Row/column groups used to plant the demo values when `values` is omitted. */
  blocks?: Block[];
  /** Seed for the deterministic shuffle (and the demo values). */
  seed?: number;
  /** Alternating row/column passes per reorder. */
  passes?: number;
  /** Heading above the matrix. */
  title?: string;
  /** Dimmed text after the heading. */
  subtitle?: string;
  /** Label on the reorder button. */
  reorderLabel?: string;
  /** Disables the reorder button. */
  disabled?: boolean;
  /** Fired after a reorder with the new row and column orders (indices into the labels). */
  onReorder?: (order: { rows: number[]; cols: number[]; score: number }) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function BertinMatrix({
  rowLabels = DEFAULT_TEAMS,
  colLabels = DEFAULT_FEATS,
  values,
  blocks = DEFAULT_BLOCKS,
  seed = 7,
  passes = 4,
  title = 'Feature use by team',
  subtitle = '— same data, reordered',
  reorderLabel = 'Reorder both axes',
  disabled = false,
  onReorder,
  className = '',
}: BertinMatrixProps) {
  // Keyed on content, not identity, so inline array props don't reshuffle every render.
  const dataKey = JSON.stringify([rowLabels, colLabels, values, blocks, seed]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { M, rows: r0, cols: c0 } = useMemo(() => build(rowLabels, colLabels, blocks, seed, values), [dataKey]);
  const [rowOrder, setRowOrder] = useState(r0);
  const [colOrder, setColOrder] = useState(c0);
  const [read, setRead] = useState('');
  const [builtFor, setBuiltFor] = useState(dataKey);
  if (builtFor !== dataKey) {
    setBuiltFor(dataKey); setRowOrder(r0); setColOrder(c0); setRead('');
  }

  /* How much of the total weight sits near the diagonal. A rising score means
     structure is being pulled together rather than scattered. */
  const score = (ro: number[], co: number[]) => {
    let s = 0;
    ro.forEach((r, i) => co.forEach((c, j) => {
      const dist = Math.abs(i / (ro.length - 1) - j / (co.length - 1));
      s += (M[r]?.[c] ?? 0) * (1 - dist);
    }));
    return Math.round(s);
  };

  /* Bertin's own method: order each axis by the weighted mean position of its
     mass on the other, ALTERNATING to convergence. One pass of each is not
     enough — reordering the columns changes what "similar" means for the rows. */
  const reorder = () => {
    if (disabled) return;
    const was = score(rowOrder, colOrder);
    let ro = [...rowOrder], co = [...colOrder];
    for (let pass = 0; pass < passes; pass++) {
      ro = ro.map((r) => {
        let num = 0, den = 0;
        co.forEach((c, j) => { const v = M[r]?.[c] ?? 0; num += v * j; den += v; });
        return { r, b: den ? num / den : 0 };
      }).sort((a, b) => a.b - b.b).map((x) => x.r);
      co = co.map((c) => {
        let num = 0, den = 0;
        ro.forEach((r, i) => { const v = M[r]?.[c] ?? 0; num += v * i; den += v; });
        return { c, b: den ? num / den : 0 };
      }).sort((a, b) => a.b - b.b).map((x) => x.c);
    }
    const now = score(ro, co);
    setRowOrder(ro); setColOrder(co);
    setRead(`diagonal concentration ${was} → ${now} · same values, permuted axes`);
    onReorder?.({ rows: ro, cols: co, score: now });
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">
          {title} <span className="font-normal text-text-dim">{subtitle}</span>
        </p>
        <button type="button" onClick={reorder} disabled={disabled}
          className="cursor-pointer rounded-md border border-border bg-raised px-[10px] py-[5px] font-sans text-[.7rem] text-text hover:border-accent active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
          {reorderLabel}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-[.66rem]">
          <thead>
            <tr>
              <th />
              {colOrder.map((c) => (
                <th key={c} scope="col" className="bm-vert h-[4.6rem] whitespace-nowrap px-0.5 py-1 text-start font-normal font-mono text-[.6rem] text-text-dim">
                  {colLabels[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowOrder.map((r) => (
              <tr key={r}>
                <th scope="row" className="whitespace-nowrap px-[5px] py-[3px] text-end font-normal font-mono text-[.6rem] text-text-dim">
                  {rowLabels[r]}
                </th>
                {colOrder.map((c) => (
                  <td key={c} className="p-0">
                    {/* A colour block is invisible to assistive tech; the label is not. */}
                    <div
                      role="img"
                      aria-label={`${rowLabels[r]} × ${colLabels[c]}: ${M[r]?.[c] ?? 0}`}
                      className="bm-cell h-[17px] w-[17px] rounded-sm"
                      style={{ background: `color-mix(in oklab, var(--accent) ${M[r]?.[c] ?? 0}%, transparent)` }}
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
