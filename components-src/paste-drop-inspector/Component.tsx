import { useState } from 'react';

type Row = { mime: string; size: number | null; kind: string; peek?: string; tree?: string };
const fmt = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;

/* readEntries returns at most 100 children per call, so it has to be called
   REPEATEDLY until it returns empty — one call silently truncates anything
   larger, which only shows up with real data. */
async function walk(entry: any, depth: number, lines: string[]): Promise<void> {
  if (depth > 3) return;
  if (entry.isFile) { lines.push('  '.repeat(depth) + entry.name); return; }
  const reader = entry.createReader();
  for (;;) {
    const batch: any[] = await new Promise((res) => reader.readEntries(res, () => res([])));
    if (!batch.length) return;
    for (const e of batch) {
      lines.push('  '.repeat(depth) + e.name + (e.isDirectory ? '/' : ''));
      if (e.isDirectory) await walk(e, depth + 1, lines);
    }
  }
}

export default function PasteDropInspector() {
  const [rows, setRows] = useState<Row[]>([]);
  const [note, setNote] = useState('Nothing inspected yet. Copy a cell from a spreadsheet for the clearest result.');
  const [over, setOver] = useState(false);

  const show = async (dt: DataTransfer, label: string) => {
    const out: Row[] = [];
    const types = [...dt.types];

    // Strings first, with their real BYTE length, not their character count.
    for (const t of types) {
      if (t === 'Files') continue;
      const data = dt.getData(t);
      out.push({ mime: t, size: new TextEncoder().encode(data).length, kind: 'string', peek: data.slice(0, 220) });
    }

    /* webkitGetAsEntry is the only way to see a dropped DIRECTORY:
       dataTransfer.files is empty for a folder, so a files-only handler
       reports nothing for a folder containing fifty items. */
    const items = [...(dt.items ?? [])];
    const entries = items.map((i) => (i as any).webkitGetAsEntry?.()).filter(Boolean);
    const dirs = entries.filter((e: any) => e.isDirectory);

    for (const it of items) {
      if (it.kind !== 'file') continue;
      const f = it.getAsFile();
      if (f && !dirs.length) out.push({ mime: f.type || 'application/octet-stream', size: f.size, kind: 'file', peek: f.name });
    }

    setRows(out);
    setNote(`${label} — ${types.length} flavour${types.length === 1 ? '' : 's'}` +
      (dirs.length ? `, ${dirs.length} directory` : '') +
      (types.length > 1 ? '. Reading only text/plain would have discarded the rest.' : '.'));

    for (const dir of dirs as any[]) {
      const lines: string[] = [];
      await walk(dir, 0, lines);
      setRows((prev) => [...prev, { mime: `${dir.name}/`, size: null, kind: 'directory', tree: lines.slice(0, 40).join('\n') || '(empty)' }]);
    }
  };

  return (
    <div className="grid gap-[9px]">
      <div
        tabIndex={0}
        aria-label="Paste with Control V or drop files here to inspect what the clipboard actually contains"
        onPaste={(e) => { e.preventDefault(); void show(e.clipboardData, 'pasted'); }}
        // preventDefault on dragover too, or the browser navigates to the file.
        onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); void show(e.dataTransfer, 'dropped'); }}
        className={`grid min-h-[92px] cursor-copy place-items-center gap-[3px] rounded-[10px] border border-dashed p-[14px] text-center focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
          over ? 'border-solid border-accent bg-[color-mix(in_oklab,var(--accent)_8%,var(--bg))]' : 'border-border bg-bg'
        }`}
      >
        <p className="m-0 text-[.84rem]">Paste or drop here</p>
        <p className="m-0 text-[.7rem] text-text-dim">Ctrl/Cmd+V, or drag a file or folder in</p>
      </div>

      <ul aria-live="polite" className="m-0 grid list-none gap-[3px] p-0">
        {rows.map((r, i) => (
          <li key={`${r.mime}-${i}`} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-2 rounded-[7px] border border-border bg-bg px-[9px] py-1.5 text-[.72rem]">
            <span className="truncate font-mono text-[.66rem]">{r.mime}</span>
            <span className="font-mono text-[.64rem] tabular-nums text-text-dim">{r.size == null ? '—' : fmt(r.size)}</span>
            <span className="font-mono text-[.6rem] text-accent">{r.kind}</span>
            {r.peek && <p className="col-span-full m-0 mt-[3px] max-h-[3.4rem] overflow-hidden whitespace-pre-wrap break-words font-mono text-[.64rem] text-text-dim">{r.peek}</p>}
            {r.tree && <div className="col-span-full mt-[3px] overflow-x-auto whitespace-pre font-mono text-[.64rem] text-text-dim">{r.tree}</div>}
          </li>
        ))}
      </ul>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">{note}</p>
    </div>
  );
}
