import { useEffect, useRef, useState } from 'react';

const COMMAND = 'npm install --save-exact prism-ui@1.4.2';

type Receipt = {
  heading: string;
  what: string;
  meta: string | null;
  canUndo: boolean;
};

export default function CopyReceipt() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [status, setStatus] = useState('');
  const previous = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    // Read the old contents FIRST, so undo is real rather than a promise.
    try { previous.current = await navigator.clipboard.readText(); }
    catch { previous.current = null; }

    try {
      await navigator.clipboard.writeText(COMMAND);
    } catch {
      setStatus('Copy failed. The clipboard is not available here.');
      setReceipt({ heading: 'Copy failed', what: 'Copy failed — nothing was written.', meta: null, canUndo: false });
      return;
    }

    const chars = COMMAND.length;
    const lines = COMMAND.split('\n').length;
    setReceipt({
      heading: 'Copied to clipboard',
      what: COMMAND,
      meta: `${chars} ${chars === 1 ? 'character' : 'characters'}${lines > 1 ? `, ${lines} lines` : ''} · from pre.cr-source`,
      canUndo: previous.current !== null && previous.current !== COMMAND,
    });
    setStatus(`Copied ${chars} characters from pre.cr-source`);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setReceipt(null), 9000);
  };

  const undo = async () => {
    const prev = previous.current;
    if (prev === null) return;
    try {
      await navigator.clipboard.writeText(prev);
      setReceipt((r) => (r ? { ...r, heading: 'Clipboard restored', what: prev, canUndo: false } : r));
      setStatus('Clipboard restored to its previous contents.');
    } catch {
      setStatus('Could not restore the clipboard.');
    }
  };

  return (
    <div className="grid max-w-[460px] gap-[10px]">
      <pre className="m-0 overflow-x-auto rounded-[10px] border border-border bg-raised px-[14px] py-3 font-mono text-[.82rem]">
        {COMMAND}
      </pre>

      <button
        type="button"
        onClick={copy}
        className="cursor-pointer justify-self-start rounded-full border-0 bg-accent px-4 py-2 font-sans text-[.84rem] text-accent-fg focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px]"
      >
        Copy command
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
              className="cursor-pointer justify-self-start border-0 bg-transparent p-0 font-mono text-[.74rem] text-text-dim underline underline-offset-[3px] hover:text-accent"
            >
              Put back what was there
            </button>
          )}
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
