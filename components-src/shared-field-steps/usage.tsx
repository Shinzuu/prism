import SharedFieldSteps, { type SharedFieldStepsProps, type Step } from './Component';

// Use it for a short multi-step form where later steps reuse fields the user already filled.
const signupSteps: Step[] = [
  { title: 'Account', fields: ['email', 'password'] },
  { title: 'Workspace', fields: ['email', 'team', 'size'] },
  { title: 'Review', fields: ['email', 'team'] },
];
const signupLabels: SharedFieldStepsProps['labels'] = {
  email: 'Work email', password: 'Password', team: 'Team name', size: 'Team size',
};

export default function Example() {
  return (
    <SharedFieldSteps
      steps={signupSteps}
      labels={signupLabels}
      submitLabel="Create workspace"
      submittedPrefix="Created with "
      onSubmit={(values) => console.log('signup', values)}
    />
  );
}
