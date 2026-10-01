import SparklineTable, { type SparkRow } from './Component';

// Use it for a compact status table where each row needs its figures and a recent trend side by side.
const queues: SparkRow[] = [
  { region: 'emails', p50: '0.4', p99: '3.1', err: '0.02%', heat: [0.1, 0.2, 0.05],
    spark: [12, 14, 13, 15, 14, 13, 12] },
  { region: 'webhooks', p50: '1.8', p99: '22.0', err: '1.40%', heat: [0.5, 0.9, 0.7],
    spark: [20, 26, 31, 38, 44, 52, 61] },
  { region: 'exports', p50: '6.2', p99: '41.5', err: '0.10%', heat: [0.7, 0.6, 0.1],
    spark: [80, 72, 66, 61, 58, 55, 54] },
];

export default function Example() {
  return (
    <SparklineTable
      rows={queues}
      headers={['Queue', 'p50 (s)', 'p99 (s)', 'Failures', 'Depth']}
      caption="Queue wait time. Depth column shows the last seven days."
      period="seven days"
    />
  );
}
