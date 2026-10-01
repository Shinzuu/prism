import WordDiff, { type DiffMode } from './Component';

// Use it to review an edit to a paragraph of copy, where a line diff would mark everything changed.
const draft = 'Our support team replies within two business days and covers all paid plans.';
const revised = 'Our support team replies within one business day and covers every plan, including free.';

export default function Example() {
  return (
    <WordDiff
      before={draft}
      after={revised}
      initialMode="split"
      inlineLabel="Combined"
      splitLabel="Side by side"
      onModeChange={(mode: DiffMode) => console.log('view', mode)}
    />
  );
}
