import OptimisticRow, { type Row } from './Component';

// A to-do list that shows new items instantly and keeps failed saves in place for retry.
const existing: Row[] = [
  { id: 101, text: 'Renew TLS certificate', state: 'done' },
  { id: 102, text: 'Rotate API keys', state: 'done' },
];

async function saveTask(text: string) {
  const res = await fetch('/api/tasks', { method: 'POST', body: JSON.stringify({ text }) });
  if (!res.ok) throw new Error(`Server said ${res.status}`);
}

export default function Example() {
  return (
    <OptimisticRow
      initialRows={existing}
      save={saveTask}
      placeholder="Add a task"
      inputLabel="Task"
      note=""
      onSaved={(row) => console.log('saved', row.text)}
      onFailed={(row, err) => console.warn(row.text, err.message)}
    />
  );
}
