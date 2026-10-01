import FreshnessCard, { type Freshness } from './Component';

// Use it for any dashboard figure that must not look current after its source has gone quiet.
async function fetchQueueDepth(): Promise<number> {
  const res = await fetch('/api/metrics/queue-depth');
  if (!res.ok) throw new Error(`Metrics answered ${res.status}.`);
  return (await res.json()).depth;
}

export default function Example() {
  return (
    <FreshnessCard
      label="Jobs waiting"
      initialValue={42}
      initialAge={0}
      fetchValue={fetchQueueDepth}
      unit="jobs"
      staleAfter={60_000}
      expireAfter={10 * 60_000}
      autoRefresh={30_000}
      onFreshnessChange={(state: Freshness) => console.log('queue depth is now', state)}
    />
  );
}
