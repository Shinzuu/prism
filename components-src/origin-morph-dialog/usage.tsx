import OriginMorphDialog, { type Row } from './Component';

// An orders table where opening a row's details should not lose the reader's place.
const orders: Row[] = [
  { id: 'ord-1', k: 'ORD-1', n: 'Ada Lovelace', v: '$84.00' },
  { id: 'ord-2', k: 'ORD-2', n: 'Grace Hopper', v: '$129.50' },
];

export default function Example() {
  return (
    <OriginMorphDialog
      rows={orders}
      detailTitle="Shipping"
      detailBody={(row) => `${row.n}'s order ships within two working days.`}
      closeLabel="Done"
      onOpen={(row) => console.log('opened', row.id)}
    />
  );
}
