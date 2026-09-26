/* The sheet reads the page rather than a list somebody maintains. Every element
   carrying data-shortcut registers itself, so a binding cannot exist without
   appearing here and the sheet cannot document one that was removed. */
(() => {
  document.querySelectorAll('[data-ks]').forEach((root) => {
    const sheet = root.querySelector('[data-ks-sheet]');
    const scrim = root.querySelector('[data-ks-scrim]');
    const groups = root.querySelector('[data-ks-groups]');
    const log = root.querySelector('[data-ks-log]');
    let last = null, buffer = '', bufferTimer = 0;

    const registry = [...root.querySelectorAll('[data-shortcut]')].map((el) => ({
      keys: el.dataset.shortcut,
      label: el.textContent.trim(),
      group: el.dataset.group || 'Other',
      el
    }));

    function render() {
      groups.textContent = '';
      const byGroup = new Map();
      for (const r of registry) {
        if (!byGroup.has(r.group)) byGroup.set(r.group, []);
        byGroup.get(r.group).push(r);
      }
      for (const [name, rows] of byGroup) {
        const g = document.createElement('div');
        g.className = 'ks__group';
        const h = document.createElement('h4');
        h.textContent = name;
        g.append(h);
        for (const r of rows) {
          const row = document.createElement('div');
          row.className = 'ks__row';
          const label = document.createElement('span');
          label.textContent = r.label;
          const keys = document.createElement('span');
          keys.className = 'ks__keys';
          // "g d" is a sequence, "shift+?" is a combination. Render both honestly.
          for (const part of r.keys.split(' ')) {
            const k = document.createElement('kbd');
            k.textContent = part.replace('+', ' + ');
            keys.append(k);
          }
          row.append(label, keys);
          g.append(row);
        }
        groups.append(g);
      }
    }

    function open() {
      render();
      last = document.activeElement;
      scrim.hidden = sheet.hidden = false;
      sheet.focus({ preventScroll: true });
      document.addEventListener('keydown', onSheetKey, true);
    }

    function close() {
      scrim.hidden = sheet.hidden = true;
      document.removeEventListener('keydown', onSheetKey, true);
      if (last && last.isConnected) last.focus();
    }

    function onSheetKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); sheet.focus(); }
    }

    function fire(entry) {
      log.textContent = entry.label + ' · ' + entry.keys;
      entry.el.dispatchEvent(new CustomEvent('ks:fire', { detail: entry.keys, bubbles: true }));
    }

    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (!sheet.hidden) return;

      if (e.key === '?') { e.preventDefault(); open(); return; }

      // Sequences: hold a short buffer so "g" then "d" resolves as one binding.
      buffer = (buffer + ' ' + e.key).trim();
      clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => { buffer = ''; }, 900);

      const exact = registry.find((r) => r.keys === buffer || r.keys === e.key);
      if (exact) { e.preventDefault(); fire(exact); buffer = ''; return; }
      const prefix = registry.some((r) => r.keys.startsWith(buffer + ' '));
      if (!prefix) buffer = '';
    });

    scrim.addEventListener('click', close);
    sheet.tabIndex = -1;
    registry.forEach((r) => r.el.addEventListener('click', () => fire(r)));
  });
})();
