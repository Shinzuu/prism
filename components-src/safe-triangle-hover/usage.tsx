import SafeTriangleHover, { type HoverGroup } from './Component';

// Use it for a settings flyout where submenus open on hover and sit beside the list.
const settings: HoverGroup[] = [
  { label: 'Account', items: ['Profile', 'Password', 'Two-factor'] },
  { label: 'Team', items: ['Members', 'Roles', 'Invites'] },
  { label: 'Integrations', items: ['Slack', 'GitHub', 'Webhooks'] },
  { label: 'Enterprise', items: ['SSO', 'Audit log'], disabled: true },
];

export default function Example() {
  return (
    <SafeTriangleHover
      groups={settings}
      showControls={false}
      initialShowTriangle={false}
      onOpenChange={(label) => console.log('open:', label)}
    />
  );
}
