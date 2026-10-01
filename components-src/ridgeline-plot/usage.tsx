import RidgelinePlot, { type RidgeSeries } from './Component';

// Use it to compare several distributions at once, e.g. checkout latency by region.
const regions: RidgeSeries[] = [
  { name: 'eu-west', mu: 180, sd: 40 },
  { name: 'us-east', mu: 210, sd: 55 },
  { name: 'ap-south', mu: 340, sd: 90, hot: true },
  { name: 'sa-east', mu: 260, sd: 70 },
];

export default function Example() {
  return (
    <RidgelinePlot
      series={regions}
      lo={50}
      hi={600}
      caption="Checkout latency by region, in milliseconds"
      tableCaption="Median and spread by region"
      seriesLabel="Region"
    />
  );
}
