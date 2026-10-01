import ConstraintSolverForm, { type ConstraintSolverFormProps } from './Component';

// Use it for a sizing form where any two of width, height, ratio and area decide the others.
const fields: NonNullable<ConstraintSolverFormProps['fields']> = [
  { key: 'w', label: 'Panel width', unit: 'mm' },
  { key: 'h', label: 'Panel height', unit: 'mm' },
  { key: 'r', label: 'Aspect', unit: 'w:h' },
  { key: 'a', label: 'Glass area', unit: 'm²' },
];

export default function Example() {
  return (
    <ConstraintSolverForm
      fields={fields}
      initialValues={{ w: '1920', h: '1080', r: '1.7778', a: '2.0736' }}
      initialDriving={['w', 'r']}
      intro="Pin any two measurements of the panel; the others follow."
      onChange={(values, driving) => console.log(values, driving)}
    />
  );
}
