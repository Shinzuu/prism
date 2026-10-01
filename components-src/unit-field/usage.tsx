import UnitField, { type UnitValue } from './Component';

// Use it in a design or theme editor where a length must keep its unit while the user nudges it.
const spacingUnits = ['px', 'rem', 'em'] as const;

export default function Example() {
  return (
    <UnitField
      label="Section padding"
      initialValue="24px"
      units={spacingUnits}
      idPrefix="section-padding"
      help="Arrow keys step by one; Shift steps by ten."
      onChange={(raw: string, value: UnitValue | null) => {
        if (value) console.log('padding', value.n, value.u);
        else console.log('invalid length', raw);
      }}
    />
  );
}
