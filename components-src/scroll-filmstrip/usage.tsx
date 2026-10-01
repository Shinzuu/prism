import ScrollFilmstrip, { type FilmPanel } from './Component';

// Use it for a short product tour where scrolling down walks the reader through steps sideways.
const steps: FilmPanel[] = [
  { no: 'Step 1', title: 'Connect your bank', body: 'Read-only access through your bank’s own login. We never see your password.' },
  { no: 'Step 2', title: 'Set a budget', body: 'Pick a monthly limit per category, or let last month’s spending suggest one.' },
  { no: 'Step 3', title: 'Get nudges', body: 'A quiet notification when a category passes 80%, never a daily digest.' },
];

export default function Example() {
  return <ScrollFilmstrip panels={steps} ariaLabel="How budgeting works" hint="scroll to continue" height={280} />;
}
