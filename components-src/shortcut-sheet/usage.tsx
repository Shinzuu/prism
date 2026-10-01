import ShortcutSheet, { type ShortcutEntry } from './Component';

// Use it in a keyboard-heavy app so the help sheet is built from the same list the handlers use.
const inboxShortcuts: ShortcutEntry[] = [
  { keys: 'g i', label: 'Inbox', group: 'Go' },
  { keys: 'g a', label: 'Archive', group: 'Go' },
  { keys: 'c', label: 'Compose', group: 'Mail' },
  { keys: 'e', label: 'Archive thread', group: 'Mail' },
  { keys: 'shift+?', label: 'Shortcuts', group: 'Help' },
];

export default function Example() {
  return (
    <ShortcutSheet
      registry={inboxShortcuts}
      title="Inbox shortcuts"
      sequenceTimeout={1200}
      onTrigger={(entry) => console.log('ran', entry.label)}
      onOpenChange={(open) => console.log('sheet open:', open)}
    />
  );
}
