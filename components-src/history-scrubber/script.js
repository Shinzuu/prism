/* Undo as a timeline you drag through rather than a key you press repeatedly.
   Scrubbing is a preview; nothing is committed until you restore, and a new
   edit made while scrubbed truncates the future rather than branching. */
(() => {
  document.querySelectorAll('[data-hs]').forEach((root) => {
    const text = root.querySelector('[data-hs-text]');
    const range = root.querySelector('[data-hs-range]');
    const when = root.querySelector('[data-hs-when]');
    const what = root.querySelector('[data-hs-what]');
    const restore = root.querySelector('[data-hs-restore]');
    const input = root.querySelector('[data-hs-input]');
    const sr = root.querySelector('[data-hs-sr]');

    const history = [
      { text: 'Sweep schedule: manual only.', label: 'created', at: Date.now() - 1000 * 60 * 42 },
      { text: 'Sweep schedule: manual, with automatic above Mach 0.7.', label: 'added automatic mode', at: Date.now() - 1000 * 60 * 28 },
      { text: 'Sweep schedule: automatic above Mach 0.7, manual override retained.', label: 'reworded', at: Date.now() - 1000 * 60 * 11 }
    ];
    let head = history.length - 1;
    const rel = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    function ago(t) {
      const mins = Math.round((t - Date.now()) / 60000);
      return Math.abs(mins) < 60 ? rel.format(mins, 'minute') : rel.format(Math.round(mins / 60), 'hour');
    }

    function paint(i) {
      const entry = history[i];
      text.textContent = entry.text;
      when.textContent = ago(entry.at);
      what.textContent = entry.label;
      const past = i < history.length - 1;
      root.dataset.past = String(past);
      restore.hidden = !past;
      // Editing the past would silently discard the future; block it and say so.
      input.disabled = past;
      input.placeholder = past ? 'Restore this version to edit from here' : 'Type a change and press Enter';
    }

    function seek(i) {
      range.value = i;
      paint(+i);
      sr.textContent = 'Version ' + (+i + 1) + ' of ' + history.length + ': ' + history[i].label;
    }

    range.addEventListener('input', () => paint(+range.value));   // scrub previews only
    range.addEventListener('change', () => seek(+range.value));

    restore.addEventListener('click', () => {
      const i = +range.value;
      // Restoring truncates the future rather than branching: one timeline,
      // and the discarded versions are named before they go.
      const dropped = history.length - 1 - i;
      history.length = i + 1;
      head = i;
      range.max = head;
      seek(head);
      sr.textContent = 'Restored. ' + dropped + (dropped === 1 ? ' later version discarded.' : ' later versions discarded.');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !input.value.trim()) return;
      history.push({ text: input.value.trim(), label: 'edited', at: Date.now() });
      head = history.length - 1;
      range.max = head;
      input.value = '';
      seek(head);
    });

    range.max = head; range.value = head;
    seek(head);
  });
})();
