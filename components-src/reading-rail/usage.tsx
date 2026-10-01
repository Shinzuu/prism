import ReadingRail, { type RailSection } from './Component';

// Use it beside a long help article so readers always see where they are.
const guide: RailSection[] = [
  { id: 'install', title: 'Install', body: 'Add the package and import the stylesheet once at your app root.' },
  { id: 'configure', title: 'Configure', body: 'Point the client at your project key. Everything else has a sensible default.' },
  { id: 'deploy', title: 'Deploy', body: 'Set the key as an environment variable on your host and redeploy.' },
  { id: 'troubleshoot', title: 'Troubleshooting', body: 'Most failures are a missing key. Check the network tab for a 401.' },
];

export default function Example() {
  return (
    <ReadingRail
      sections={guide}
      navLabel="Guide contents"
      articleLabel="Setup guide"
      readingLine={0.2}
      onSectionChange={(id) => history.replaceState(null, '', `#${id}`)}
    />
  );
}
