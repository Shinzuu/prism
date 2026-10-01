import SlideConfirm, { type SlideConfirmProps } from './Component';

// Use it in place of a confirm dialog for one destructive action that should take a deliberate gesture.
const handleConfirm: SlideConfirmProps['onConfirm'] = () => {
  console.log('workspace archived');
};

export default function Example() {
  return (
    <SlideConfirm
      label="Slide to archive this workspace"
      doneLabel="Archived"
      doneMessage="Workspace archived. Members lose access now."
      gripLabel="Slide right to confirm archiving. Or hold the right arrow key."
      commitThreshold={0.95}
      onConfirm={handleConfirm}
    />
  );
}
