/* Copy, then show exactly what went to the clipboard and where it came from,
   with a window to put back whatever was there before. A copy button that only
   says "Copied!" is asking to be trusted about the one thing you cannot see. */
(() => {
  document.querySelectorAll('[data-cr]').forEach((root) => {
    const src = root.querySelector('[data-cr-source]');
    const btn = root.querySelector('[data-cr-btn]');
    const receipt = root.querySelector('[data-cr-receipt]');
    const what = root.querySelector('[data-cr-what]');
    const count = root.querySelector('[data-cr-count]');
    const from = root.querySelector('[data-cr-from]');
    const undo = root.querySelector('[data-cr-undo]');
    const sr = root.querySelector('[data-cr-sr]');
    let previous = null, timer = 0;

    const label = (el) => el.dataset.crLabel || el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : '');

    async function copy(text, origin) {
      // Read the old contents first so undo is real rather than a promise.
      try { previous = await navigator.clipboard.readText(); } catch { previous = null; }
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        sr.textContent = 'Copy failed. The clipboard is not available here.';
        what.textContent = 'Copy failed — nothing was written.';
        receipt.hidden = false;
        return;
      }
      what.textContent = text;
      const chars = text.length, lines = text.split('\n').length;
      count.textContent = chars + (chars === 1 ? ' character' : ' characters') +
        (lines > 1 ? ', ' + lines + ' lines' : '');
      from.textContent = origin;
      undo.hidden = previous === null || previous === text;
      receipt.hidden = false;
      sr.textContent = 'Copied ' + chars + ' characters from ' + origin;

      clearTimeout(timer);
      timer = setTimeout(() => { receipt.hidden = true; }, 9000);
    }

    btn.addEventListener('click', () => copy(src.textContent.trim(), label(src)));

    undo.addEventListener('click', async () => {
      if (previous === null) return;
      try {
        await navigator.clipboard.writeText(previous);
        what.textContent = previous;
        root.querySelector('[data-cr-head]');
        receipt.querySelector('.cr__head').textContent = 'Clipboard restored';
        undo.hidden = true;
        sr.textContent = 'Clipboard restored to its previous contents.';
      } catch { sr.textContent = 'Could not restore the clipboard.'; }
    });
  });
})();
