import SpotlightCards, { type SpotlightCardData } from './Component';

// Use it for a short row of feature or pricing cards that should respond to the pointer.
const plans: SpotlightCardData[] = [
  { kicker: 'Starter', title: 'For solo builders',
    text: 'One workspace, unlimited drafts, and email support within a day.',
    spec: [['price', '$9/mo'], ['seats', '1']] },
  { kicker: 'Team', title: 'For small studios',
    text: 'Shared libraries, review links and roles for up to ten people.',
    spec: [['price', '$29/mo'], ['seats', '10']] },
  { kicker: 'Scale', title: 'For agencies',
    text: 'Client workspaces, SSO and a named contact for onboarding.',
    spec: [['price', 'custom'], ['seats', 'unlimited']] },
];

export default function Example() {
  return <SpotlightCards cards={plans} maxTilt={3} className="max-w-5xl" />;
}
