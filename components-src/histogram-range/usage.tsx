import HistogramRange, { type HistogramRangeProps } from './Component';

// Use it as a faceted-search filter where people should see how many items each end of the range drops.
const nightsPerBin: HistogramRangeProps['counts'] = [3, 9, 18, 26, 31, 24, 15, 8, 4, 2];

export default function Example() {
  return (
    <HistogramRange
      id="stay-length"
      label="Length of stay"
      min={1}
      max={30}
      counts={nightsPerBin}
      defaultLow={3}
      defaultHigh={14}
      step={1}
      largeStep={7}
      itemsLabel="listings"
      formatValue={(n) => `${n} ${n === 1 ? 'night' : 'nights'}`}
      onChange={(low, high) => console.log(low, high)}
    />
  );
}
