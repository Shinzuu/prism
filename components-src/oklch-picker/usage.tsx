import { useState } from 'react';
import OklchPicker, { type OklchColor } from './Component';

// A theme editor where the brand accent is picked perceptually and saved as an oklch() string.
export default function Example() {
  const [accent, setAccent] = useState('oklch(55% 0.12 250)');
  const start: OklchColor = { l: 55, c: 0.12, h: 250 };

  return (
    <div>
      <OklchPicker
        defaultValue={start}
        copyLabel="copy token"
        gamutWarning="This accent will be clipped on sRGB screens."
        onChange={(_color, css) => setAccent(css)}
        onCopy={(css) => console.log('copied', css)}
      />
      <p>Saved accent: {accent}</p>
    </div>
  );
}
