import CopyReceipt, { type CopyReceiptProps } from './Component';

// Use it next to install commands or API keys, where people need to see exactly what landed on the clipboard.
const props: CopyReceiptProps = {
  command: 'curl -fsSL https://get.example.dev/install.sh | sh',
  sourceLabel: 'install snippet',
  buttonLabel: 'Copy install script',
  receiptMs: 6000,
};

export default function Example() {
  return (
    <CopyReceipt
      {...props}
      onCopy={(text) => console.log('copied', text.length, 'chars')}
      onUndo={() => console.log('clipboard restored')}
    />
  );
}
