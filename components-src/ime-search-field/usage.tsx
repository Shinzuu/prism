import ImeSearchField, { type ImeSearchFieldProps } from './Component';

// Use it for a search-as-you-type box that must not fire on half-composed Chinese, Japanese or Korean input.
const japaneseReplay: Pick<ImeSearchFieldProps, 'replaySteps' | 'replayResult'> = {
  replaySteps: ['t', 'to', 'tou', 'toukyo', 'toukyou'],
  replayResult: '東京',
};

export default function Example() {
  return (
    <ImeSearchField
      id="city-search"
      label="Search cities"
      placeholder="City name"
      debounceMs={250}
      {...japaneseReplay}
      onSearch={(query) => console.log('fetch', query)}
    />
  );
}
