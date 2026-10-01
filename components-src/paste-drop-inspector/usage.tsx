import PasteDropInspector, { type Row } from './Component';

// A debugging panel in an editor for checking what a paste from another app really carries.
function logFlavours(rows: Row[], source: 'pasted' | 'dropped') {
  console.table(rows.map((r) => ({ source, mime: r.mime, bytes: r.size })));
}

export default function Example() {
  return (
    <PasteDropInspector
      title="Drop an export here"
      hint="CSV, JSON or a whole folder"
      initialNote="We will list every format the data arrives in."
      peekLength={80}
      onInspect={logFlavours}
    />
  );
}
