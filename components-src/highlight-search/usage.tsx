import HighlightSearch, { type HighlightSearchProps } from './Component';

// Use it for find-in-page over a block of text you render, such as release notes or a help article.
const releaseNotes: HighlightSearchProps['paragraphs'] = [
  'Exports now run in the background, so large workspaces no longer time out when you download a report.',
  'Search results keep their highlight after you edit a filter, and the match count updates as you type.',
];

export default function Example() {
  return (
    <HighlightSearch
      id="release-notes-find"
      label="Search release notes"
      regionLabel="Release notes"
      defaultTerm="search"
      paragraphs={releaseNotes}
      onChange={(term) => console.log(term)}
    />
  );
}
