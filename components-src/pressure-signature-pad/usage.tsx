import { useState } from 'react';
import PressureSignaturePad from './Component';

// A delivery-confirmation form that stores the customer's signature as a PNG.
export default function Example() {
  const [png, setPng] = useState<string | null>(null);

  return (
    <form onSubmit={(e) => { e.preventDefault(); console.log('submit', png?.length); }}>
      <PressureSignaturePad
        title="Customer signature"
        clearLabel="Start again"
        canvasHeight={240}
        onStrokeEnd={(canvas) => setPng(canvas.toDataURL('image/png'))}
        onClear={() => setPng(null)}
      />
      <button type="submit" disabled={!png}>Confirm delivery</button>
    </form>
  );
}
