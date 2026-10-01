import CommandPalette, { type Command } from './Component';

// Use it as the keyboard-first entry point to every action in an app.
const actions: Command[] = [
  { label: 'Create invoice', hint: 'Ctrl I' },
  { label: 'Find customer', hint: 'Ctrl F' },
  { label: 'Export report' },
  { label: 'Sign out' },
];

export default function Example() {
  return (
    <CommandPalette
      commands={actions}
      hotkey="p"
      shortcutLabel="Ctrl P"
      triggerLabel="Jump to…"
      idPrefix="app-cmd"
      onSelect={(command) => console.log('run', command.label)}
    />
  );
}
