import OdometerStat, { type Figure, type OdometerStatProps } from './Component';

// A KPI strip on a dashboard whose numbers tick over when fresh data arrives.
const figures: Figure[] = [
  { label: 'Orders today', value: 4812, delta: '+318 in the last hour' },
  { label: 'Checkout p95', value: 212, delta: '+9ms vs last week', suffix: 'ms' },
];

const bump: OdometerStatProps['getNext'] = (prev) =>
  prev.map((f) => ({ ...f, value: f.value + 7 }));

export default function Example() {
  return (
    <OdometerStat
      figures={figures}
      getNext={bump}
      rollLabel="Refresh"
      onRoll={(next) => console.log('rolled to', next)}
    />
  );
}
