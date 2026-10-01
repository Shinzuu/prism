import SpreadsheetGrid, { type SpreadsheetGridProps } from './Component';

// Use it for a small editable table where people expect Excel keys: arrows, Enter, Tab, F2, Escape.
const columns = ['SKU', 'Product', 'Price', 'Stock'];
const rows: SpreadsheetGridProps['rows'] = [
  ['A-100', 'Desk lamp', '39.00', '12'],
  ['A-101', 'Monitor arm', '89.00', '4'],
  ['B-200', 'Cable tray', '24.50', '30'],
];

export default function Example() {
  return (
    <SpreadsheetGrid
      columns={columns}
      rows={rows}
      caption="Inventory. Arrow keys move, Enter commits, Escape reverts."
      onCellChange={(row, col, value) => console.log(`row ${row} ${columns[col] ?? col} ->`, value)}
    />
  );
}
