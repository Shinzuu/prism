import AdjustLastAction, { type AdjustLastActionProps, type Params } from './Component';

// Use it in an editor where a one-shot effect should stay tweakable until the user moves on.
const softGlow: Params = { radius: 3, spread: 24 };
const glowRanges: AdjustLastActionProps['ranges'] = { radius: [0, 12], spread: [0, 60] };

export default function Example() {
  return (
    <AdjustLastAction
      initialParams={softGlow}
      ranges={glowRanges}
      actionLabel="Apply glow"
      actionName="glow"
      onAdjust={(p: Params) => console.log('re-ran with', p)}
      onCommit={(p) => console.log('committed', p)}
    />
  );
}
