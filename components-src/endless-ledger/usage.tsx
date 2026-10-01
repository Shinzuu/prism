import EndlessLedger, { type LedgerColumns } from './Component';

// Use it for a long audit or trade log where every row must be in the DOM for find-in-page and printing.
const symbols = ['BTC', 'ETH', 'SOL', 'ADA'];
const columns: LedgerColumns = ['#', 'Asset', 'Side', 'Units', 'Fill'];

export default function Example() {
  return (
    <EndlessLedger
      rowCount={10000}
      symbols={symbols}
      title="Fills today"
      columns={columns}
      footnote="Every fill since the session opened, rendered in full."
      onPaint={(ms) => console.log(`ledger painted in ${ms}ms`)}
    />
  );
}
