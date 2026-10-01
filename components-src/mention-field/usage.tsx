import MentionField, { type MentionValue, type Person } from './Component';

// Use it for comments or notes where people must be tagged by id, not just by name.
const team: Person[] = [
  { id: 'emp-104', label: 'Priya Nair', hint: 'Finance' },
  { id: 'emp-221', label: 'Tomás Vidal', hint: 'Legal' },
  { id: 'emp-305', label: 'Grace Osei', hint: 'Ops' },
];

export default function Example() {
  return (
    <MentionField
      people={team}
      defaultValue=""
      label="Review note"
      placeholder="Write a note, type @ to tag a reviewer"
      maxSuggestions={4}
      onChange={(value: MentionValue) => {
        const ids = value.mentions.map((m) => m.id);
        console.log(value.text, 'notifies', ids);
      }}
      onMention={(p: Person) => console.log('tagged', p.id)}
    />
  );
}
