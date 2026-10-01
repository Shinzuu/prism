import { useRef, useState } from 'react';

const FAIL_RATE = 0.34;
const LATENCY: [number, number] = [500, 1400];

export type RowState = 'pending' | 'done' | 'failed';
export type Row = { id: number; text: string; state: RowState; error?: string };

const DEFAULT_ROWS: Row[] = [
  { id: 1, text: 'F-14D Super Tomcat', state: 'done' },
  { id: 2, text: 'Panavia Tornado', state: 'done' },
];

const simulatedWrite = (text: string, failRate: number, latency: [number, number]) =>
  new Promise<string>((resolve, reject) => {
    const ms = latency[0] + Math.random() * (latency[1] - latency[0]);
    setTimeout(
      () => (Math.random() < failRate ? reject(new Error('The server rejected the write')) : resolve(text)),
      ms
    );
  });

export interface OptimisticRowProps {
  /** Rows already on the server when the list mounts. */
  initialRows?: Row[];
  /** Persists one row; reject to show the failure in place. Defaults to a simulated server. */
  save?: (text: string) => Promise<unknown>;
  /** Failure probability of the simulated server, used only when `save` is not given. */
  failRate?: number;
  /** Min and max latency of the simulated server in ms, used only when `save` is not given. */
  latency?: [number, number];
  /** Placeholder in the add field. */
  placeholder?: string;
  /** Accessible name of the add field. */
  inputLabel?: string;
  /** Text of the submit button. */
  submitLabel?: string;
  /** Row badge while the write is in flight. */
  pendingLabel?: string;
  /** Row badge once the server confirms. */
  doneLabel?: string;
  /** Text of the retry action on a failed row. */
  retryLabel?: string;
  /** Text of the discard action on a failed row. */
  discardLabel?: string;
  /** Explanatory line under the list. Empty string hides it. */
  note?: string;
  /** Shows a loading line instead of the rows, for while the initial list is fetched. */
  loading?: boolean;
  /** Text of the loading line. */
  loadingLabel?: string;
  /** Disables adding, retrying and discarding. */
  disabled?: boolean;
  /** Fires when a row is added, before the server answers. */
  onAdd?: (text: string) => void;
  /** Fires when the server confirms a row. */
  onSaved?: (row: Row) => void;
  /** Fires when a write fails. */
  onFailed?: (row: Row, error: Error) => void;
  /** Fires when a failed row is discarded. */
  onDiscard?: (row: Row) => void;
  /** Extra classes for the root element. */
  className?: string;
}

export default function OptimisticRow({
  initialRows = DEFAULT_ROWS,
  save,
  failRate = FAIL_RATE,
  latency = LATENCY,
  placeholder = 'Add an airframe designation',
  inputLabel = 'Designation',
  submitLabel = 'Add',
  pendingLabel = 'saving…',
  doneLabel = 'confirmed',
  retryLabel = 'retry',
  discardLabel = 'discard',
  note = 'Roughly one in three writes fails, so the rollback is visible.',
  loading = false,
  loadingLabel = 'Loading…',
  disabled = false,
  onAdd,
  onSaved,
  onFailed,
  onDiscard,
  className = '',
}: OptimisticRowProps) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const nextId = useRef(initialRows.reduce((m, r) => Math.max(m, r.id), 0) + 1);
  const locked = disabled || loading;

  const patch = (id: number, next: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const send = async (id: number, text: string) => {
    patch(id, { state: 'pending', error: undefined });
    try {
      await (save ? save(text) : simulatedWrite(text, failRate, latency));
      patch(id, { state: 'done' });
      setStatus(`${text} saved.`);
      onSaved?.({ id, text, state: 'done' });
    } catch (err) {
      /* Fail IN PLACE. The row stays, the text the user typed stays, and the
         reason is stated — rather than the row vanishing and taking the input
         with it. */
      const error = err instanceof Error ? err : new Error(String(err));
      patch(id, { state: 'failed', error: error.message });
      setStatus(`${text} failed to save. Retry or discard.`);
      onFailed?.({ id, text, state: 'failed', error: error.message }, error);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const id = nextId.current++;
    // Appears immediately, before the server knows anything about it.
    setRows((rs) => [...rs, { id, text, state: 'pending' }]);
    onAdd?.(text);
    void send(id, text);
  };

  return (
    <div className={`grid max-w-[440px] gap-[10px] ${className}`}>
      <form className="flex gap-1.5" onSubmit={submit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={inputLabel}
          autoComplete="off"
          disabled={disabled}
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-[9px] font-sans text-[.86rem] text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={locked}
          className="cursor-pointer rounded-lg border-0 bg-accent px-4 py-[9px] font-sans text-[.86rem] text-accent-fg hover:opacity-90 active:opacity-80 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </form>

      {loading ? (
        <p aria-busy="true" className="m-0 rounded-lg border border-dashed border-border bg-bg px-3 py-[9px] text-[.86rem] text-text-dim opacity-60">
          {loadingLabel}
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-[5px] p-0">
          {rows.map((r) => (
            <li
              key={r.id}
              className={`flex items-center gap-[10px] rounded-lg border px-3 py-[9px] text-[.86rem] ${
                r.state === 'pending' ? 'or-in border-dashed border-border bg-bg opacity-60'
                : r.state === 'failed' ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_7%,var(--bg))]'
                : 'border-border bg-bg'
              }`}
            >
              <span className="flex-1">{r.text}</span>
              <em className={`font-mono text-[.68rem] not-italic ${r.state === 'failed' ? 'text-accent' : 'text-text-dim'}`}>
                {r.state === 'pending' && pendingLabel}
                {r.state === 'done' && doneLabel}
                {r.state === 'failed' && (
                  <>
                    {r.error} ·{' '}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void send(r.id, r.text)}
                      className="or-link hover:opacity-80 active:opacity-60 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                    >
                      {retryLabel}
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => { setRows((rs) => rs.filter((x) => x.id !== r.id)); setStatus(`${r.text} discarded.`); onDiscard?.(r); }}
                      className="or-link ml-2 hover:opacity-80 active:opacity-60 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                    >
                      {discardLabel}
                    </button>
                  </>
                )}
              </em>
            </li>
          ))}
        </ul>
      )}

      {note && (
        <p className="m-0 text-[.74rem] text-text-dim">
          {note}
        </p>
      )}
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
