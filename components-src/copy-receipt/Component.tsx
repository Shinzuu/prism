import { useEffect, useRef, useState } from 'react';

const DEFAULT_COMMAND = 'npm install --save-exact prism-ui@1.4.2';

type Receipt = {
  heading: string;
  what: string;
  meta: string | null;
  canUndo: boolean;
};

export interface CopyReceiptProps {
  /** Text shown in the source block and written to the clipboard. */
  command?: string;
  /** Where the text came from, named in the receipt and the announcement. */
  sourceLabel?: string;
  /** Label of the copy button. */
  buttonLabel?: string;
  /** Label of the button that restores the previous clipboard contents. */
  undoLabel?: string;
  /** How long the receipt stays up after a copy, in milliseconds. */
  receiptMs?: number;
  /** Called after the text was written to the clipboard. */
  onCopy?: (text: string) => void;
  /** Called after the previous clipboard contents were put back. */
  onUndo?: (restored: string) => void;
  /** Disables the copy and undo buttons. */
  disabled?: boolean;
  /** Extra classes for the root element. */
  className?: string;
}

export default function CopyReceipt({
  command = DEFAULT_COMMAND,
  sourceLabel = 'pre.cr-source',
  buttonLabel = 'Copy command',
  undoLabel = 'Put back what was there',
  receiptMs = 9000,
  onCopy,
  onUndo,
  disabled = false,
  className = '',
}: CopyReceiptProps) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const previous = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    if (disabled || busy) return;
    setBusy(true);
    try {
      // Read the old contents FIRST, so undo is real rather than a promise.
      try { previous.current = await navigator.clipboard.readText(); }
      catch { previous.current = null; }

      try {
        await navigator.clipboard.writeText(command);
      } catch {
        setStatus('Copy failed. The clipboard is not available here.');
        setReceipt({ heading: 'Copy failed', what: 'Copy failed — nothing was written.', meta: null, canUndo: false });
        return;
      }

      const chars = command.length;
      const lines = command.split('\n').length;
      setReceipt({
        heading: 'Copied to clipboard',
        what: command,
        meta: `${chars} ${chars === 1 ? 'character' : 'characters'}${lines > 1 ? `, ${lines} lines` : ''} · from ${sourceLabel}`,
        canUndo: previous.current !== null && previous.current !== command,
      });
      setStatus(`Copied ${chars} characters from ${sourceLabel}`);
      onCopy?.(command);

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setReceipt(null), receiptMs);
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    const prev = previous.current;
    if (prev === null || disabled) return;
    try {
      await navigator.clipboard.writeText(prev);
      setReceipt((r) => (r ? { ...r, heading: 'Clipboard restored', what: prev, canUndo: false } : r));
      setStatus('Clipboard restored to its previous contents.');
      onUndo?.(prev);
    } catch {
      setStatus('Could not restore the clipboard.');
    }
  };

  return (
    <div className={`grid max-w-[460px] gap-[10px] ${className}`}>
      <pre className="m-0 overflow-x-auto rounded-[10px] border border-border bg-raised px-[14px] py-3 font-mono text-[.82rem]">
        {command}
      </pre>

      {/* busy is not shown as disabled: the clipboard read is usually instant,
          and greying the button for a few milliseconds reads as a flicker. */}
      <button
        type="button"
        onClick={copy}
        disabled={disabled}
        aria-busy={busy || undefined}
        className="cursor-pointer justify-self-start rounded-full border-0 bg-accent px-4 py-2 font-sans text-[.84rem] text-accent-fg focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px] enabled:hover:opacity-90 enabled:active:translate-y-px aria-busy:cursor-progress disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonLabel}
      </button>

      {/* A copy button that only says "Copied!" is asking to be trusted about
          the one thing you cannot see. This shows what went, and offers the
          clipboard's previous contents back. */}
      {receipt && (
        <div className="grid gap-[6px] rounded-[10px] border border-border bg-surface px-[14px] py-3">
          <p className="m-0 text-[.8rem] font-semibold">{receipt.heading}</p>
          <pre className="m-0 max-h-[5.4em] overflow-auto whitespace-pre-wrap break-words rounded-[7px] bg-bg px-[10px] py-2 font-mono text-[.76rem]">
            {receipt.what}
          </pre>
          {receipt.meta && (
            <p className="m-0 text-[.74rem] tabular-nums text-text-dim">{receipt.meta}</p>
          )}
          {receipt.canUndo && (
            <button
              type="button"
              onClick={undo}
              disabled={disabled}
              className="cursor-pointer justify-self-start border-0 bg-transparent p-0 font-mono text-[.74rem] text-text-dim underline underline-offset-[3px] hover:text-accent active:text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-text-dim"
            >
              {undoLabel}
            </button>
          )}
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
