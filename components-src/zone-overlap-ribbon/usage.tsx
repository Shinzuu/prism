import ZoneOverlapRibbon, { type ZoneMember } from './Component';

// Use it when scheduling across time zones, to show the hours a distributed team actually shares.
const team: ZoneMember[] = [
  { name: 'London', tz: 'Europe/London', start: 9, end: 17 },
  { name: 'Toronto', tz: 'America/Toronto', start: 8, end: 16 },
  { name: 'Karachi', tz: 'Asia/Karachi', start: 11, end: 20 },
];

export default function Example() {
  return (
    <ZoneOverlapRibbon
      people={team}
      days={5}
      start={Date.UTC(2026, 10, 2)}
      subtitle="— working hours, week of 2 Nov"
      overlapLabel="all three"
    />
  );
}
