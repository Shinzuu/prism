import MarchingAnts, { type MarchingAntsItem } from './Component';

// Use it to mark rows that are still processing, such as an upload queue or a batch export list.
const exports: MarchingAntsItem[] = [
  { name: 'q3-revenue.xlsx', busy: true },
  { name: 'customers.csv', busy: false },
];

export default function Example() {
  return (
    <MarchingAnts
      items={exports}
      busyLabel="exporting"
      doneLabel="ready"
      note=""
      announce={(n) => `${n} ${n === 1 ? 'export' : 'exports'} in progress.`}
    />
  );
}
