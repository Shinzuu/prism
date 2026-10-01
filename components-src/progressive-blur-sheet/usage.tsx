import ProgressiveBlurSheet from './Component';

// Use it for a confirm step that should feel layered over the page rather than greyed out.
export default function Example() {
  return (
    <ProgressiveBlurSheet
      intro="Archiving hides the project from everyone but admins."
      triggerLabel="Archive project"
      cardTitle="Project Atlas"
      cardCaption="Weekly commits, last six weeks."
      bars={[12, 40, 66, 58, 90, 34]}
      title="Archive Atlas?"
      description="Open issues stay readable. You can restore the project from Settings at any time."
      confirmLabel="Archive"
      onConfirm={() => console.log('archived')}
      onCancel={() => console.log('kept')}
    />
  );
}
