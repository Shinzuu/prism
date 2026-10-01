import StagedPipeline, { type PipelineStage, type StageState } from './Component';

// Use it to show a multi-step job (an import, a release) where a failure should skip what follows.
const importSteps: PipelineStage[] = [
  { name: 'Upload CSV', ms: 800 },
  { name: 'Validate rows', ms: 1400, fails: true },
  { name: 'Match contacts', ms: 1800 },
  { name: 'Write records', ms: 1000 },
];

export default function Example() {
  return (
    <StagedPipeline
      stages={importSteps}
      ariaLabel="Contact import"
      failureMessage="12 rows have an invalid email address."
      retryLabel="retry import"
      onStageChange={(name: string, state: StageState) => console.log(name, state)}
      onComplete={() => console.log('import finished')}
    />
  );
}
