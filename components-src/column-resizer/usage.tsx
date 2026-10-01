import ColumnResizer, { type Column } from './Component';

// Use it for a data table whose columns the user sizes once and expects to stay sized.
const columns: Column[] = [
  { label: 'Invoice', w: 140 },
  { label: 'Customer', w: 220 },
  { label: 'Amount', w: 110 },
];

export default function Example() {
  return (
    <ColumnResizer
      columns={columns}
      rows={[
        ['INV-1042', 'Northwind Traders', '$1,280.00'],
        ['INV-1043', 'Contoso Ltd', '$312.50'],
      ]}
      minWidth={80}
      storageKey="invoices-col-widths"
      caption="Recent invoices"
      onResize={(widths) => console.log(widths)}
    />
  );
}
