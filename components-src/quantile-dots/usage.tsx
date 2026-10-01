import QuantileDots from './Component';

// Use it to show a forecast's spread as countable outcomes instead of a probability curve.
export default function Example() {
  return (
    <QuantileDots
      title="Build duration"
      subject="CI build"
      unit="min"
      outcomeVerb="finish"
      mean={14}
      sd={4}
      min={4}
      max={30}
      initialThreshold={18}
      onThresholdChange={(t, under) => console.log(`${under}% finish within ${t} min`)}
    />
  );
}
