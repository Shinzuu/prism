import LocalizedProgressLoader, { type LocaleMessages, type LocaleOption } from './Component';

// Use it for a progress bar whose status line must read correctly in every language you ship, plural forms included.
const messages: Record<string, LocaleMessages> = {
  en: { dir: 'ltr', one: 'Syncing {n} photo', other: 'Syncing {n} photos' },
  de: { dir: 'ltr', one: '{n} Foto wird synchronisiert', other: '{n} Fotos werden synchronisiert' },
  he: { dir: 'rtl', one: 'מסנכרן תמונה אחת', two: 'מסנכרן שתי תמונות', other: 'מסנכרן {n} תמונות' },
};
const locales: readonly LocaleOption[] = [['en', 'English'], ['de', 'Deutsch'], ['he', 'עברית']];

export default function Example({ synced = 7 }: { synced?: number }) {
  return (
    <LocalizedProgressLoader
      messages={messages}
      locales={locales}
      defaultLocale="de"
      total={40}
      value={synced}
      onLocaleChange={(tag) => console.log(tag)}
    />
  );
}
