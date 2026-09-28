import { useRef, useState } from 'react';

const FAIL_RATE = 0.34;
const LATENCY: [number, number] = [500, 1400];

type Row = { id: number; text: string; state: 'pending' | 'done' | 'failed'; error?: string };

const write = (text: string) =>
  new Promise<string>((resolve, reject) => {
    const ms = LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]);
    setTimeout(
      () => (Math.random() < FAIL_RATE ? reject(new Error('The server rejected the write')) : resolve(text)),
      ms
    );
  });

export default function OptimisticRow() {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, text: 'F-14D Super Tomcat', state: 'done' },
    { id: 2, text: 'Panavia Tornado', state: 'done' },
  ]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const nextId = useRef(3);

  const patch = (id: number, next: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const send = async (id: number, text: string) => {
    patch(id, { state: 'pending', error: undefined });
    try {
      await write(text);
      patch(id, { state: 'done' });
      setStatus(`${text} saved.`);
    } catch (err) {
      /* Fail IN PLACE. The row stays, the text the user typed stays, and the
         reason is stated — rather than the row vanishing and taking the input
         with it. */
      patch(id, { state: 'failed', error: (err as Error).message });
      setStatus(`${text} failed to save. Retry or discard.`);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const id = nextId.current++;
    // Appears immediately, before the server knows anything about it.
    setRows((rs) => [...rs, { id, text, state: 'pending' }]);
    void send(id, text);
  };

  return (
    <div className="grid max-w-[440px] gap-[10px]">
      <form className="flex gap-1.5" onSubmit={submit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an airframe designation"
          aria-label="Designation"
          autoComplete="off"
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-[9px] font-sans text-[.86rem] text-text focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-lg border-0 bg-accent px-4 py-[9px] font-sans text-[.86rem] text-accent-fg"
        >
          Add
        </button>
      </form>

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
              {r.state === 'pending' && 'saving…'}
              {r.state === 'done' && 'confirmed'}
              {r.state === 'failed' && (
                <>
                  {r.error} ·{' '}
                  <button type="button" onClick={() => void send(r.id, r.text)} className="or-link">retry</button>
                  <button
                    type="button"
                    onClick={() => { setRows((rs) => rs.filter((x) => x.id !== r.id)); setStatus(`${r.text} discarded.`); }}
                    className="or-link ml-2"
                  >
                    discard
                  </button>
                </>
              )}
            </em>
          </li>
        ))}
      </ul>

      <p className="m-0 text-[.74rem] text-text-dim">
        Roughly one in three writes fails, so the rollback is visible.
      </p>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
