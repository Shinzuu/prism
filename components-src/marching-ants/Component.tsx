export type MarchingAntsItem = { name: string; busy: boolean };

const DEFAULT_ITEMS: readonly MarchingAntsItem[] = [
  { name: 'airframe-plate.svg', busy: true },
  { name: 'sweep-schedule.csv', busy: true },
  { name: 'loadout.json', busy: false },
];

const DEFAULT_NOTE =
  'The outline follows whatever shape it is given — here a notched one — because the ants are drawn on the border box, not on a ring dropped in the middle.';

const DEFAULT_ANNOUNCE = (busy: number) => `${busy} items uploading.`;

export interface MarchingAntsProps {
  /** Rows to list; busy rows get the crawling outline. */
  items?: readonly MarchingAntsItem[];
  /** Status text on a busy row. */
  busyLabel?: string;
  /** Status text on a finished row. */
  doneLabel?: string;
  /** Text inside the notched demo panel; pass an empty string to hide the panel. */
  note?: string;
  /** Builds the screen-reader announcement from the number of busy rows. */
  announce?: (busyCount: number) => string;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function MarchingAnts({
  items = DEFAULT_ITEMS,
  busyLabel = 'uploading',
  doneLabel = 'done',
  note = DEFAULT_NOTE,
  announce = DEFAULT_ANNOUNCE,
  className = '',
}: MarchingAntsProps) {
  const busyCount = items.filter((f) => f.busy).length;

  return (
    <div className={`grid gap-3 ${className}`}>
      <ul className="m-0 grid list-none gap-[7px] p-0">
        {items.map((f) => (
          <li
            key={f.name}
            data-ma-item
            aria-busy={f.busy || undefined}
            className="ma-row relative flex items-center gap-3 rounded-[9px] bg-surface px-[14px] py-[11px] text-[.84rem]"
          >
            <span className="flex-1">{f.name}</span>
            <span className={`font-mono text-[.68rem] ${f.busy ? 'text-text-dim' : 'text-accent'}`}>
              {f.busy ? busyLabel : doneLabel}
            </span>
          </li>
        ))}
      </ul>

      {/* An irregular outline, to show the ants trace the real border box. */}
      {note && (
        <div
          data-ma-item
          aria-busy
          className="ma-odd relative rounded-[9px] bg-surface px-4 py-[14px] text-[.84rem]"
        >
          <p className="m-0 max-w-[46ch] text-[.78rem] text-text-dim">{note}</p>
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {announce(busyCount)}
      </p>
    </div>
  );
}
