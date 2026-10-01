import HeatmapCalendar, { type HeatmapCalendarProps } from './Component';

// Use it to show a year-at-a-glance activity record, such as commits, workouts or support tickets per day.
const commitsByDay: Record<string, number> = {
  '2026-09-28': 4,
  '2026-09-29': 9,
  '2026-09-30': 2,
};

// Defined outside the component so the grid is not rebuilt on every render.
const getCount: NonNullable<HeatmapCalendarProps['getCount']> = (date) =>
  commitsByDay[date.toLocaleDateString('en-CA')] ?? 0; // en-CA gives a local YYYY-MM-DD

export default function Example() {
  return (
    <HeatmapCalendar
      weeks={12}
      title="Commits, last 12 weeks"
      unit="commit"
      unitPlural="commits"
      ariaLabel="Daily commit counts"
      thresholds={[1, 2, 4, 8]}
      getCount={getCount}
      onSelect={(date, count) => console.log(date.toDateString(), count)}
    />
  );
}
