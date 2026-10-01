import SegmentNav, { type SegmentNavProps } from './Component';

// Use it to switch between a few sibling views of the same page, like a dashboard's time range.
const ranges: SegmentNavProps['items'] = ['Day', 'Week', 'Month', 'Quarter', 'Year'];

export default function Example() {
  return (
    <SegmentNav
      items={ranges}
      defaultIndex={1}
      ariaLabel="Time range"
      onChange={(index, label) => console.log('range', index, label)}
    />
  );
}
