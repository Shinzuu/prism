import TearOffPanel, { type TearOffPanelProps } from './Component';

// Use it for a live metric someone may want on a second monitor while they keep working here.
const logRate: TearOffPanelProps['onRateChange'] = (rate) => console.log('sample rate', rate);

export default function Example() {
  return (
    <TearOffPanel
      channelName="ops-queue-depth"
      title="Queue depth"
      unit="jobs/s"
      caption="jobs/s · shared with the torn-off window"
      initialRate={10}
      maxRate={30}
      onRateChange={logRate}
      onTornChange={(torn) => console.log(torn ? 'popped out' : 'docked')}
    />
  );
}
