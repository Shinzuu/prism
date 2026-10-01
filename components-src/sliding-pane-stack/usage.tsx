import SlidingPaneStack, { type PaneTree } from './Component';

// Use it for drill-down navigation through nested docs or settings where the trail should stay visible.
const settingsTree: PaneTree = {
  Account: { Profile: ['Name', 'Avatar'], Security: ['Password', 'Two-factor', 'Sessions'], Delete: null },
  Billing: { Plan: ['Upgrade', 'Downgrade'], Invoices: ['History', 'Tax IDs'], Usage: null },
  Team: { Members: ['Invite', 'Roles'], Groups: ['Create', 'Permissions'] },
};

export default function Example() {
  return (
    <SlidingPaneStack
      tree={settingsTree}
      rootTitle="Settings"
      ariaLabel="Settings"
      emptyText="Nothing more here."
      description="Each choice opens a new pane beside the last."
      onNavigate={(path) => console.log('open', path.join(' / '))}
    />
  );
}
