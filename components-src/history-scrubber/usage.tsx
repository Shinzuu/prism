import HistoryScrubber, { type HistoryEntry } from './Component';

// Use it for a single editable field whose past versions people need to browse and roll back to, such as a policy line or a product title.
const now = Date.now();
const titleVersions: HistoryEntry[] = [
  { text: 'Linen shirt', label: 'imported', at: now - 1000 * 60 * 90 },
  { text: 'Relaxed linen shirt, stone', label: 'added colour', at: now - 1000 * 60 * 35 },
  { text: 'Relaxed linen shirt in stone, unisex', label: 'merchandiser edit', at: now - 1000 * 60 * 5 },
];

export default function Example() {
  return (
    <HistoryScrubber
      entries={titleVersions}
      sliderLabel="Product title history"
      inputLabel="Edit product title"
      editLabel="you edited"
      onRestore={(entry, discarded) => console.log('restored', entry.text, discarded)}
      onCommit={(entry) => console.log('saved', entry.text)}
    />
  );
}
