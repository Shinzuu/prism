import ForcedColorsChart, { type ChartSeries } from './Component';

// Use it for a small multi-series line chart that must stay readable in Windows High Contrast and greyscale print.
const latency: ChartSeries[] = [
  { name: 'p50', dash: '', marker: 0, data: [120, 118, 125, 131, 122, 119] },
  { name: 'p95', dash: '5 3', marker: 1, data: [310, 295, 340, 362, 330, 301] },
  { name: 'p99', dash: '2 2', marker: 2, data: [480, 470, 520, 590, 505, 488] },
];

export default function Example() {
  return (
    <ForcedColorsChart
      series={latency}
      title="API latency (ms)"
      max={600}
      ariaLabel="API latency percentiles over six days. Values are also listed in the table below."
      seriesHeader="percentile"
      pointLabel={(i) => `day ${i + 1}`}
      onToggle={(on) => console.log('forced colours simulated:', on)}
    />
  );
}
