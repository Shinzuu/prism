import FoldRevealSection, { type FoldRevealSectionProps } from './Component';

// Use it for a short step-by-step process section that should unfold as the reader scrolls.
const steps: FoldRevealSectionProps['panels'] = ['Brief', 'Wireframes', 'Visual design', 'Build', 'Launch'];

export default function Example() {
  return (
    <FoldRevealSection
      panels={steps}
      intro="How a project moves through the studio. Scroll to open each stage."
      outro="Most projects take six to ten weeks from brief to launch."
      regionLabel="Project stages"
      showNote={false}
    />
  );
}
