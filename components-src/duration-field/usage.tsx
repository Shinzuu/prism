import DurationField, { type DurationFieldProps } from './Component';

// Use it anywhere a form asks for a length of time, such as a session expiry or a retry window.
const onCommit: DurationFieldProps['onCommit'] = (seconds) => console.log('save expiry', seconds);

export default function Example() {
  return (
    <DurationField
      label="Session expires after"
      defaultValue="45m"
      examples={['30m', '1h', '8h', '1d']}
      step={300}
      onChange={(seconds, raw) => console.log(raw, '→', seconds)}
      onCommit={onCommit}
    />
  );
}
