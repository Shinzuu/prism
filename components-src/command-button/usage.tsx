import CommandButton, { type CommandButtonProps } from './Component';

// Use it when buttons only need to open a dialog or popover and you want no click handlers at all.
const copy: Partial<CommandButtonProps> = {
  dialogButtonLabel: 'Publish',
  dialogTitle: 'Publish this draft?',
  dialogBody: 'It goes live for everyone with the link. You can unpublish at any time.',
  popoverButtonLabel: 'Help',
};

export default function Example() {
  return (
    <CommandButton
      {...copy}
      idPrefix="publish"
      logLimit={5}
      onCommand={(command, targetId) => console.log(command, targetId)}
    />
  );
}
