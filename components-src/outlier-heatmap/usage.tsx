import OutlierHeatmap, { type Dimensions, type Point } from './Component';

// Find which build or browser explains a cluster of slow page loads.
const dimensions: Dimensions = { browser: ['chrome', 'safari'], build: ['a1', 'b2'] };

const points: Point[] = Array.from({ length: 300 }, (_, i) => {
  const browser = i % 2 ? 'chrome' : 'safari';
  const build = i % 3 ? 'a1' : 'b2';
  const slow = browser === 'safari' && build === 'b2';
  return { browser, build, size: (i * 37) % 900, ms: slow ? 600 : 120 + (i % 50) };
});

export default function Example() {
  return (
    <OutlierHeatmap
      points={points}
      dimensions={dimensions}
      title="Page load time"
      minSelection={8}
      onSelect={(indices) => console.log(`${indices.length} loads selected`)}
    />
  );
}
