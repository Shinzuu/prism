import { useMemo } from 'react';

/** One participant: an IANA zone and their local working hours (24h, end exclusive). */
export type ZoneMember = { name: string; tz: string; start: number; end: number };

const DEFAULT_PEOPLE: ZoneMember[] = [
  { name: 'Lisbon', tz: 'Europe/Lisbon', start: 9, end: 18 },
  { name: 'Berlin', tz: 'Europe/Berlin', start: 9, end: 17 },
  { name: 'New York', tz: 'America/New_York', start: 9, end: 17 },
  { name: 'Mumbai', tz: 'Asia/Kolkata', start: 10, end: 19 },
];
const DAYS = 7;
const START = Date.UTC(2026, 9, 24);   // Sat 24 Oct 2026 — straddles the EU transition

/* The offset must be asked for PER INSTANT, not once. An offset is a property
   of a moment, not of a place, and caching one for the week reintroduces the
   exact bug the IANA zones were adopted to fix. */
function offsetAt(tz: string, date: Date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value])) as Record<string, string>;
  const asUTC = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour! % 24, +p.minute!);
  return (asUTC - date.getTime()) / 3600000;
}

export interface ZoneOverlapRibbonProps {
  /** People whose working hours are compared. */
  people?: ZoneMember[];
  /** Number of days shown. */
  days?: number;
  /** First instant shown, as a UTC timestamp in milliseconds. */
  start?: number;
  /** Heading of the ribbon. */
  title?: string;
  /** Muted text after the heading. */
  subtitle?: string;
  /** Label of the lane where everyone overlaps. */
  overlapLabel?: string;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function ZoneOverlapRibbon({
  people = DEFAULT_PEOPLE,
  days = DAYS,
  start = START,
  title = 'Overlap',
  subtitle = '— working hours, week of 26 Oct',
  overlapLabel = 'all four',
  className = '',
}: ZoneOverlapRibbonProps) {
  const totalHours = days * 24;
  const { busy, overlap, shifted } = useMemo(() => {
    const busy = people.map(() => new Array<boolean>(totalHours).fill(false));
    const offsets = people.map(() => new Set<number>());
    for (let h = 0; h < totalHours; h++) {
      const at = new Date(start + h * 3600000);
      people.forEach((p, i) => {
        const off = offsetAt(p.tz, at);
        offsets[i]!.add(off);
        const localHour = (((h + off) % 24) + 24) % 24;
        const localDay = Math.floor((h + off) / 24);
        const weekday = new Date(start + localDay * 86400000).getUTCDay();
        const isWeekend = weekday === 0 || weekday === 6;
        busy[i]![h] = !isWeekend && localHour >= p.start && localHour < p.end;
      });
    }
    const overlap = Array.from({ length: totalHours }, (_, h) => people.every((_, i) => busy[i]![h]));
    const shifted = people.filter((_, i) => offsets[i]!.size > 1).map((p) => p.name);
    return { busy, overlap, shifted };
  }, [people, start, totalHours]);

  const lane = (flags: boolean[], solid: boolean) => {
    const bands: { left: number; width: number }[] = [];
    let h = 0;
    while (h < totalHours) {
      if (!flags[h]) { h++; continue; }
      let end = h;
      while (end < totalHours && flags[end]) end++;
      bands.push({ left: (h / totalHours) * 100, width: ((end - h) / totalHours) * 100 });
      h = end;
    }
    return (
      <div className="relative h-4 overflow-hidden rounded bg-[color-mix(in_oklab,var(--border)_40%,transparent)]">
        {bands.map((b, i) => (
          <div key={i}
            className={`absolute inset-y-0 ${solid ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--accent)_42%,transparent)]'}`}
            style={{ insetInlineStart: `${b.left}%`, width: `${b.width}%` }} />
        ))}
      </div>
    );
  };

  const hours = overlap.filter(Boolean).length;

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">
          {title} <span className="font-normal text-text-dim">{subtitle}</span>
        </p>
        <p className="m-0 font-mono text-[.66rem] text-text-dim">{hours} overlapping hours this week</p>
      </div>

      <div className="grid gap-[3px] text-[.64rem]">
        {people.map((p, i) => (
          <div key={p.name} className="grid grid-cols-[7.2rem_1fr] items-center gap-2">
            <span className="truncate font-mono text-[.6rem] text-text-dim" title={p.tz}>
              {p.name}{shifted.includes(p.name) ? ' ⤯' : ''}
            </span>
            {lane(busy[i]!, false)}
          </div>
        ))}
        <div className="grid grid-cols-[7.2rem_1fr] items-center gap-2">
          <span className="font-mono text-[.6rem] text-text-dim">{overlapLabel}</span>
          {lane(overlap, true)}
        </div>
      </div>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        {shifted.length
          ? `${shifted.join(' and ')} changed UTC offset mid-week (⤯), so the overlap moves by an hour partway through — a fixed-offset calculation shows a straight band and is wrong after the transition.`
          : 'No offset change this week.'}
      </p>
    </div>
  );
}
