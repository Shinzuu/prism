import { useState } from 'react';
import ChallengeResponseChecklist, { type Item } from './Component';

// Use it for a go/no-go procedure where every step is confirmed on its own and one waits on a live signal.
const deploySteps: Item[] = [
  { q: 'Migrations reviewed', a: 'APPROVED' },
  { q: 'Feature flags', a: 'DEFAULT OFF' },
  { q: 'Staging smoke test', a: 'GREEN', needsGround: true, hold: 'Smoke test still running. This item holds.' },
  { q: 'On-call paged in', a: 'ACKNOWLEDGED' },
];

export default function Example() {
  const [smokeGreen] = useState(false);
  return (
    <ChallengeResponseChecklist
      items={deploySteps}
      title="Before deploy"
      labels={{ commit: 'Ship it' }}
      preconditionMet={smokeGreen}
      onConfirm={(i, item) => console.log(i, item.q)}
      onCommit={() => console.log('deploy started')}
    />
  );
}
