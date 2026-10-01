import ShortcutRecorder, { type ShortcutRecorderProps } from './Component';

// Use it on a keyboard-settings page where each action gets one rebindable shortcut.
const reserved: ShortcutRecorderProps['taken'] = {
  'Ctrl+S': 'Save',
  'Ctrl+Z': 'Undo',
  'Ctrl+Shift+Z': 'Redo',
};

export default function Example() {
  return (
    <ShortcutRecorder
      actionName="Toggle sidebar"
      defaultValue="Ctrl + B"
      taken={reserved}
      idPrefix="toggle-sidebar"
      conflictMessage={(combo, takenBy) => `${combo} already runs ${takenBy}.`}
      onChange={(binding) => console.log('new binding', binding)}
    />
  );
}
