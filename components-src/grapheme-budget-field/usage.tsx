import GraphemeBudgetField, { type GraphemeBudgetFieldProps } from './Component';

// Use it wherever a length limit is shown to people, such as a profile bio or a post caption, so emoji count as one character each.
const bioProps: GraphemeBudgetFieldProps = {
  id: 'profile-bio',
  label: 'Profile bio',
  limit: 160,
  defaultValue: 'Building tools for 🌍 teams',
  truncateLabel: 'Trim to 160',
};

export default function Example() {
  return (
    <GraphemeBudgetField
      {...bioProps}
      onChange={(value, count) => console.log(count, value)}
    />
  );
}
