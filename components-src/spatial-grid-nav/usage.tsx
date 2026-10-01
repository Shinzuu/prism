import SpatialGridNav, { type SpatialGridNavProps, type Tile } from './Component';

// Use it for a dashboard of mixed-size widgets where arrow keys should go where the eye expects.
const widgets: Tile[] = [
  { name: 'Revenue', code: 'MTD', col: 2 },
  { name: 'Signups', code: '7d' },
  { name: 'Churn', code: '30d' },
  { name: 'Pipeline', code: 'Q4', row: 2 },
  { name: 'Tickets', code: 'open', col: 2 },
  { name: 'Uptime', code: '99.9' },
];

const announce: SpatialGridNavProps['selectedLabel'] = (t) => `${t.name} widget focused`;

export default function Example() {
  return (
    <SpatialGridNav
      tiles={widgets}
      ariaLabel="Dashboard widgets"
      hint="Use the arrow keys to move between widgets."
      selectedLabel={announce}
      onSelect={(tile, i) => console.log('open widget', i, tile.name)}
    />
  );
}
