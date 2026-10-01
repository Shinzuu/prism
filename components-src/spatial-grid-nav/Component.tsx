import { useRef, useState } from 'react';

export type Tile = {
  name: string;
  code: string;
  /** Columns the tile spans. */
  col?: number;
  /** Rows the tile spans. */
  row?: number;
};

const DEFAULT_TILES: Tile[] = [
  { name: 'Tomcat', code: 'F-14', col: 2 },
  { name: 'Tornado', code: 'GR4' },
  { name: 'Flogger', code: 'MiG-23' },
  { name: 'Lancer', code: 'B-1B', col: 2 },
  { name: 'Fencer', code: 'Su-24', row: 2 },
  { name: 'Aardvark', code: 'F-111' },
  { name: 'Backfire', code: 'Tu-22M', col: 2 },
  { name: 'Mirage', code: 'G8' },
];

/* Arrow keys move to the tile the eye expects, computed from GEOMETRY rather
   than DOM order. With mixed tile sizes those two orders disagree constantly,
   which is why DOM-order navigation feels wrong in any non-uniform grid. */
export interface SpatialGridNavProps {
  /** Tiles to lay out; mixed spans are what make geometric navigation matter. */
  tiles?: Tile[];
  /** Instruction line above the grid. */
  hint?: string;
  /** Accessible name of the tile navigation. */
  ariaLabel?: string;
  /** Status text for the selected tile. */
  selectedLabel?: (tile: Tile) => string;
  /** Fired when a tile is reached by arrow keys or clicked. */
  onSelect?: (tile: Tile, index: number) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

const defaultSelectedLabel = (t: Tile) => `${t.name} selected`;

export default function SpatialGridNav({
  tiles = DEFAULT_TILES,
  hint = 'Arrow keys move by geometry, not by DOM order. Tab enters and leaves the grid once.',
  ariaLabel = 'Airframe tiles',
  selectedLabel = defaultSelectedLabel,
  onSelect,
  className = '',
}: SpatialGridNavProps) {
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [now, setNow] = useState('');

  const box = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { l: r.left, r: r.right, t: r.top, b: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };

  /* Score the distance ALONG the axis of travel far more heavily than the
     drift across it, so a slightly offset neighbour beats a distant aligned
     one — which is what "the tile the eye expects" actually means. */
  const best = (fromIdx: number, dir: string) => {
    const from = refs.current[fromIdx];
    if (!from) return fromIdx;
    const a = box(from);
    let winner = fromIdx, score = Infinity;
    refs.current.forEach((el, i) => {
      if (!el || i === fromIdx) return;
      const b = box(el);
      let along: number, across: number;
      if (dir === 'ArrowRight') { if (b.l < a.r - 1) return; along = b.l - a.r; across = Math.abs(b.cy - a.cy); }
      else if (dir === 'ArrowLeft') { if (b.r > a.l + 1) return; along = a.l - b.r; across = Math.abs(b.cy - a.cy); }
      else if (dir === 'ArrowDown') { if (b.t < a.b - 1) return; along = b.t - a.b; across = Math.abs(b.cx - a.cx); }
      else { if (b.b > a.t + 1) return; along = a.t - b.b; across = Math.abs(b.cx - a.cx); }
      const s = along + across * 2.2;
      if (s < score) { score = s; winner = i; }
    });
    return winner;
  };

  const focus = (i: number) => {
    const t = tiles[i];
    if (!t) return;
    setActive(i);
    refs.current[i]?.focus();
    setNow(selectedLabel(t));
    onSelect?.(t, i);
  };

  return (
    <div className={`grid gap-[9px] ${className}`}>
      <p className="m-0 text-[.76rem] text-text-dim">
        {hint}
      </p>

      {/* Not role="grid". A grid promises rows of cells, and the tiles here
          span arbitrary rows and columns and reflow at 480px — which is the
          component's whole point. Claiming a structure that does not exist is
          worse than claiming none: it makes a screen reader announce row and
          column positions that are invented. The roving tabindex and the
          geometric arrow keys work the same either way. */}
      <nav
        aria-label={ariaLabel}
        className="grid auto-rows-[62px] grid-cols-4 gap-[7px] max-[480px]:grid-cols-2"
        onKeyDown={(e) => {
          if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
          e.preventDefault();
          if (e.key === 'Home') return focus(0);
          if (e.key === 'End') return focus(tiles.length - 1);
          focus(best(active, e.key));
        }}
      >
        {tiles.map((t, i) => (
          <a
            key={t.name}
            href="#"
            ref={(el) => { refs.current[i] = el; }}
            tabIndex={i === active ? 0 : -1}
            onFocus={() => setActive(i)}
            onClick={(e) => { e.preventDefault(); onSelect?.(t, i); }}
            style={{ gridColumn: `span ${t.col ?? 1}`, gridRow: `span ${t.row ?? 1}` }}
            className="sn-tile grid content-center gap-0.5 rounded-[9px] border border-border bg-surface px-3 py-[9px] text-[.86rem] text-text no-underline hover:border-accent active:translate-y-px"
          >
            {t.name}
            <small className="font-mono text-[.66rem] text-text-dim">{t.code}</small>
          </a>
        ))}
      </nav>

      <p role="status" aria-live="polite" className="m-0 min-h-[1.2em] text-[.78rem] text-text-dim">{now}</p>
    </div>
  );
}
