import PriorityOverflowToolbar, { type ToolbarAction } from './Component';

// Use it for an editor toolbar that has to survive narrow panes and zoom without wrapping.
const invoiceActions: ToolbarAction[] = [
  { label: 'Send', pri: 1 },
  { label: 'Download PDF', pri: 2 },
  { label: 'Record payment', pri: 3 },
  { label: 'Void', pri: 5, disabled: true },
  { label: 'Copy link', pri: 4 },
];

export default function Example() {
  return (
    <PriorityOverflowToolbar
      actions={invoiceActions}
      ariaLabel="Invoice actions"
      moreLabel="Actions"
      initialWidth={320}
      onAction={(a) => console.log('run', a.label)}
      onOverflowChange={(hidden) => console.log(`${hidden.length} in menu`)}
    />
  );
}
