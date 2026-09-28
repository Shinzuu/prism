# Paste Drop Inspector

- **Element ID:** `paste-drop-inspector`
- **Type:** card
- **Live:** https://prism.shinzuu-dev.workers.dev/components/paste-drop-inspector
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/paste-drop-inspector.json

Fans out every flavour the clipboard actually handed over, with byte sizes, and unfolds a dropped directory as a tree — the two things a normal paste handler throws away without telling you.

## Final prompt

```
Build an inspector that reveals what a paste or a drop actually contains, in plain HTML, CSS and vanilla JavaScript.

On paste, enumerate EVERY type in clipboardData.types and show each with its byte length — measured with TextEncoder, not string.length, since those differ for any non-ASCII content. A paste is not one value: a spreadsheet cell arrives as text/html, text/plain and often an image at once, and reading only text/plain throws away the structure the user copied.

On drop, use DataTransferItem.webkitGetAsEntry() to detect DIRECTORIES. dataTransfer.files is empty for a dropped folder, so a handler reading only files reports nothing for a folder containing fifty items and appears to have ignored the drop entirely.

When walking a directory, call readEntries REPEATEDLY until it returns an empty array. It yields at most 100 entries per call, so a single call silently truncates larger folders — one of those bugs that only appears with real data.

Show a short preview of each string flavour so the difference between the HTML and the plain-text versions is visible rather than implied.

Call preventDefault on dragenter and dragover as well as drop — without it the browser navigates away to the dropped file, which destroys the page.

Make the drop zone focusable and handle paste on the document when it has focus, so the component is operable by keyboard. Put the results in an aria-live region.

Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a paste target that shows what the user pasted.

Read event.clipboardData.getData('text/plain') and displayed it. Copying a cell range from a spreadsheet delivers text/html with the table structure, text/plain with tab-separated values, and frequently an image/png as well — reading only text/plain silently discards the structure the user copied, which is exactly the data they wanted to keep.

### Attempt 2

> List every available type, and accept dropped files too.

Used dataTransfer.files for the drop. A dropped FOLDER produces an empty files list, so dropping a directory containing fifty files reports nothing at all — the interface appears to ignore the drop. Only webkitGetAsEntry exposes directories, and its readEntries returns at most 100 children per call, so a single call silently truncates anything larger.

## Why this one is worth keeping

Both failures are lossy in a way that produces no error. Reading text/plain from a paste always works — it returns a string, the feature looks finished, and the structured version of the same content that the user actually copied is discarded in silence. The directory case is worse because the interface appears inert: drop a folder on a files-only handler and absolutely nothing happens, so it reads as a broken drop target rather than as an unsupported case. The readEntries batching limit belongs to the same family: correct on the small folders anyone tests with, quietly truncating at exactly 100 entries in production.
