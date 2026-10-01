import SortMorphTable, { type Row, type SortMorphTableProps } from './Component';

// Use it for a short operational table where people re-sort often and need to keep their place.
const nightlyJobs: Row[] = [
  { service: 'etl-orders', dur: 1840, fails: 0, when: '02:10' },
  { service: 'etl-users', dur: 920, fails: 1, when: '02:25' },
  { service: 'search-reindex', dur: 3310, fails: 4, when: '03:00' },
  { service: 'backup-snap', dur: 640, fails: 0, when: '03:40' },
];
const columns: SortMorphTableProps['columns'] = [
  { key: 'service', label: 'Job' }, { key: 'dur', label: 'Duration' },
  { key: 'fails', label: 'Retries' }, { key: 'when', label: 'Started' },
];

export default function Example() {
  return (
    <SortMorphTable
      rows={nightlyJobs}
      columns={columns}
      title="Nightly jobs"
      defaultSort={{ key: 'fails', dir: -1 }}
      initialStatus="Sorted by retries, descending"
      onSortChange={(sort) => console.log('sort', sort.key, sort.dir)}
    />
  );
}
