import CollationSortTable, { type CollationOption } from './Component';

// Use it wherever a user-facing list of names must sort by the reader's language rules.
const rules: CollationOption[] = [
  { value: 'de', label: 'German', note: 'Umlauts sort with their base letter.' },
  { value: 'da', label: 'Danish', note: 'Æ, Ø and Å are separate letters after Z.' },
];

export default function Example() {
  return (
    <CollationSortTable
      names={['Ærø', 'Aalborg', 'Odense', 'Øster', 'Århus', 'Zealand']}
      options={rules}
      defaultLocale="da"
      title="Cities"
      onLocaleChange={(locale, order) => console.log(locale, order)}
    />
  );
}
