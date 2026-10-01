import MagicPlusDrag, { type MagicPlusDragProps } from './Component';

// Use it for an ordered checklist or pipeline where people add a step at an exact position rather than at the end.
const onboarding: MagicPlusDragProps['defaultItems'] = [
  'Create workspace',
  'Invite teammates',
  'Connect calendar',
];

export default function Example() {
  return (
    <MagicPlusDrag
      defaultItems={onboarding}
      hint="Drag the plus to add an onboarding step."
      placeholder="Step name"
      onChange={(steps) => console.log(steps)}
    />
  );
}
