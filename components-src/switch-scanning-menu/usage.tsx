import SwitchScanningMenu, { type MenuGroup } from './Component';

// Use it when the user drives the whole UI with a single switch, e.g. an assistive button or one key.
const phrases: MenuGroup[] = [
  { name: 'Needs', items: ['Water', 'Food', 'Rest'] },
  { name: 'Feelings', items: ['Good', 'Tired', 'In pain'] },
  { name: 'People', items: ['Nurse', 'Family'] },
];

export default function Example() {
  return (
    <SwitchScanningMenu
      groups={phrases}
      title="Quick phrases"
      initialDwell={2000}
      maxDwell={4000}
      switchLabel="Select"
      onSelect={(item, group) => console.log(`speak "${item}" (${group})`)}
    />
  );
}
