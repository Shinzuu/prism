const FILES = [
  { name: 'airframe-plate.svg', busy: true },
  { name: 'sweep-schedule.csv', busy: true },
  { name: 'loadout.json', busy: false },
];

export default function MarchingAnts() {
  const busyCount = FILES.filter((f) => f.busy).length;

  return (
    <div className="grid gap-3">
      <ul className="m-0 grid list-none gap-[7px] p-0">
        {FILES.map((f) => (
          <li
            key={f.name}
            data-ma-item
            aria-busy={f.busy || undefined}
            className="ma-row relative flex items-center gap-3 rounded-[9px] bg-surface px-[14px] py-[11px] text-[.84rem]"
          >
            <span className="flex-1">{f.name}</span>
            <span className={`font-mono text-[.68rem] ${f.busy ? 'text-text-dim' : 'text-accent'}`}>
              {f.busy ? 'uploading' : 'done'}
            </span>
          </li>
        ))}
      </ul>

      {/* An irregular outline, to show the ants trace the real border box. */}
      <div
        data-ma-item
        aria-busy
        className="ma-odd relative rounded-[9px] bg-surface px-4 py-[14px] text-[.84rem]"
      >
        <p className="m-0 max-w-[46ch] text-[.78rem] text-text-dim">
          The outline follows whatever shape it is given — here a notched one — because the ants are
          drawn on the border box, not on a ring dropped in the middle.
        </p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {busyCount} items uploading.
      </p>
    </div>
  );
}
