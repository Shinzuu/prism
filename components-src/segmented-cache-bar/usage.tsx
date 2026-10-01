import SegmentedCacheBar, { type SegmentedCacheBarProps } from './Component';

// Use it for a parallel warm-up or build step where which parts finished matters, not only how many.
const handleComplete: SegmentedCacheBarProps['onComplete'] = ({ done, miss }) =>
  console.log(`${done} warmed, ${miss} missed`);

export default function Example() {
  return (
    <SegmentedCacheBar
      shards={24}
      workers={6}
      missRate={0.05}
      title="Priming CDN edge"
      progressLabel="CDN edge priming progress"
      description="Six edge nodes pull from one queue of 24 asset bundles."
      onComplete={handleComplete}
    />
  );
}
