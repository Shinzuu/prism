import { useRef, useState } from 'react';

const DEFAULT_COLUMNS = ['Designation', 'Sweep', 'Ceiling', 'Crew'];
const DEFAULT_ROWS = [
  ['F-14D', '20–68', '15200', '2'],
  ['Tornado', '25–67', '15240', '2'],
  ['MiG-23', '16–72', '18000', '1'],
  ['B-1B', '15–67', '18000', '4'],
  ['Su-24', '16–69', '11000', '2'],
];

/* The grid is the easy part; the contract people already know from Excel is
   the component: arrows move, Enter commits and drops one row, Tab commits and
   moves right, typing replaces, F2 edits in place, Escape reverts the cell you
   were editing rather than the whole row. */
export interface SpreadsheetGridProps {
  /** Column headings. */
  columns?: string[];
  /** Initial cell values, one array per row in column order. */
  rows?: string[][];
  /** Screen-reader caption describing the table and its keys. */
  caption?: string;
  /** Hint shown while a cell is being edited. */
  editingHint?: string;
  /** Hint shown while navigating. */
  idleHint?: string;
  /** Makes the grid read-only: cells can be navigated but not edited or cleared. */
  disabled?: boolean;
  /** Fired when a cell is committed with a new value or cleared. */
  onCellChange?: (row: number, col: number, value: string) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function SpreadsheetGrid({
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  caption = 'Airframe register. Arrow keys move, Enter commits and drops down, Tab commits and moves right.',
  editingHint = 'Editing · Enter commits · Escape reverts',
  idleHint = 'Type to replace · Enter to commit · Escape to cancel',
  disabled = false,
  onCellChange,
  className = '',
}: SpreadsheetGridProps) {
  const [cells, setCells] = useState(() => rows.map((r) => [...r]));
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [at, setAt] = useState({ r: 0, c: 0 });
  const [editing, setEditing] = useState(false);
  const before = useRef('');
  const refs = useRef<(HTMLTableCellElement | null)[][]>([]);

  const focusCell = (r: number, c: number) => {
    if (r < 0 || r >= cells.length || c < 0 || c >= columns.length) return;
    setAt({ r, c });
    refs.current[r]?.[c]?.focus();
  };

  const startEdit = (replace?: string) => {
    const el = refs.current[at.r]?.[at.c];
    if (!el || editing || disabled) return;
    before.current = cells[at.r]![at.c]!;
    setEditing(true);
    if (replace !== undefined) {
      setCells((g) => g.map((row, y) => row.map((v, x) => (y === at.r && x === at.c ? replace : v))));
    }
    requestAnimationFrame(() => {
      el.focus();
      const sel = getSelection(); const range = document.createRange();
      range.selectNodeContents(el);
      if (replace !== undefined) range.collapse(false);
      sel?.removeAllRanges(); sel?.addRange(range);
    });
  };

  const endEdit = (commit: boolean) => {
    const el = refs.current[at.r]?.[at.c];
    if (!el || !editing) return;
    const now = el.textContent ?? '';
    setEditing(false);
    if (!commit) {
      el.textContent = before.current;
      setCells((g) => g.map((row, y) => row.map((v, x) => (y === at.r && x === at.c ? before.current : v))));
    } else {
      setCells((g) => g.map((row, y) => row.map((v, x) => (y === at.r && x === at.c ? now : v))));
      if (now !== before.current) {
        setDirty((d) => new Set(d).add(`${at.r}-${at.c}`));
        onCellChange?.(at.r, at.c, now);
      }
    }
    requestAnimationFrame(() => el.focus());
  };

  return (
    <div className={`grid gap-2 ${className}`}
      onKeyDown={(e) => {
        const k = e.key;
        if (editing) {
          if (k === 'Enter') { e.preventDefault(); endEdit(true); focusCell(at.r + 1, at.c); }
          else if (k === 'Escape') { e.preventDefault(); endEdit(false); }
          else if (k === 'Tab') { e.preventDefault(); endEdit(true); focusCell(at.r, at.c + (e.shiftKey ? -1 : 1)); }
          return;
        }
        if (k === 'ArrowDown') { e.preventDefault(); focusCell(at.r + 1, at.c); }
        else if (k === 'ArrowUp') { e.preventDefault(); focusCell(at.r - 1, at.c); }
        else if (k === 'ArrowLeft') { e.preventDefault(); focusCell(at.r, at.c - 1); }
        else if (k === 'ArrowRight') { e.preventDefault(); focusCell(at.r, at.c + 1); }
        else if (k === 'Enter' || k === 'F2') { e.preventDefault(); startEdit(); }
        else if (k === 'Tab') { e.preventDefault(); focusCell(at.r, at.c + (e.shiftKey ? -1 : 1)); }
        else if (k === 'Home') { e.preventDefault(); focusCell(at.r, 0); }
        else if (k === 'End') { e.preventDefault(); focusCell(at.r, columns.length - 1); }
        else if (k === 'Delete' || k === 'Backspace') {
          e.preventDefault();
          if (disabled) return;
          setCells((g) => g.map((row, y) => row.map((v, x) => (y === at.r && x === at.c ? '' : v))));
          setDirty((d) => new Set(d).add(`${at.r}-${at.c}`));
          onCellChange?.(at.r, at.c, '');
        }
        // A printable character replaces the cell, exactly as a spreadsheet does.
        else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); startEdit(k); }
      }}
    >
      <table
        className={`sg-table w-full border-collapse text-[.88rem]${disabled ? ' opacity-50' : ''}`}
      >
        <caption className="sr-only">
          {caption}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="w-[2.2rem] border border-border bg-raised px-2.5 py-[7px] text-left text-[.78rem] font-medium text-text-dim">
              <span className="sr-only">Row</span>
            </th>
            {columns.map((c) => (
              <th key={c} scope="col" className="border border-border bg-raised px-2.5 py-[7px] text-left text-[.78rem] font-medium text-text-dim">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((row, y) => (
            <tr key={y}>
              <th scope="row" className="w-[2.2rem] border border-border bg-raised px-2.5 py-[7px] text-center text-[.74rem] font-normal text-text-dim">{y + 1}</th>
              {row.map((v, x) => (
                <td
                  key={x}
                  ref={(el) => { (refs.current[y] ??= [])[x] = el; }}
                  tabIndex={at.r === y && at.c === x ? 0 : -1}
                  data-editing={editing && at.r === y && at.c === x ? 'true' : undefined}
                  data-dirty={dirty.has(`${y}-${x}`) ? 'true' : undefined}
                  contentEditable={editing && at.r === y && at.c === x ? 'plaintext-only' : false}
                  suppressContentEditableWarning
                  onMouseDown={() => { if (!editing) focusCell(y, x); }}
                  onDoubleClick={() => { focusCell(y, x); startEdit(); }}
                  className={`sg-cell relative ${disabled ? 'cursor-not-allowed' : 'cursor-cell hover:bg-raised'} border border-border bg-bg px-2.5 py-[7px] text-left tabular-nums outline-none`}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="m-0 text-[.74rem] text-text-dim">
        {editing ? editingHint : idleHint}
      </p>
    </div>
  );
}
