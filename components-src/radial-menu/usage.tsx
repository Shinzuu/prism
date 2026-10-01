import RadialMenu, { type RadialItem } from './Component';

// Use it on a canvas or touch surface where a long-press should offer a handful of actions.
const layerActions: RadialItem[] = [
  { label: 'Bring forward' },
  { label: 'Send back' },
  { label: 'Group' },
  { label: 'Lock', disabled: true },
];

export default function Example() {
  return (
    <RadialMenu
      items={layerActions}
      triggerLabel="Hold for layer actions"
      menuLabel="Layer actions"
      holdMs={300}
      radius={80}
      onSelect={(item, i) => console.log(`#${i}`, item.label)}
      onCancel={() => console.log('cancelled')}
    />
  );
}
