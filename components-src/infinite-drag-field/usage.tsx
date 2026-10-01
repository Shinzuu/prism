import InfiniteDragField, { type InfiniteDragFieldProps } from './Component';

// Use it in a design or animation inspector where people scrub a number by dragging its label, like in Figma or Blender.
const rotation: InfiniteDragFieldProps = {
  label: 'Rotate',
  unit: 'deg',
  handleLabel: 'Rotation, drag to scrub or use arrow keys',
  inputLabel: 'Rotation in degrees',
  min: -360,
  max: 360,
  largeStep: 15,
  hint: '',
};

export default function Example() {
  return <InfiniteDragField {...rotation} onChange={(deg) => console.log(deg)} />;
}
