import WeightShiftButton from './Component';

// Use it for a deliberate press-and-hold action where the type itself should show the pressure.
export default function Example() {
  return (
    <WeightShiftButton
      label="Hold to delete"
      initialReadout="Hold to delete the draft."
      description="Keep holding: the label gains weight while the press lasts."
      onHoldStart={() => console.log('hold started')}
      onHoldEnd={() => console.log('hold released')}
    />
  );
}
