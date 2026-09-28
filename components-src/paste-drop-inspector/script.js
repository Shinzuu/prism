/* What the clipboard actually handed you.
   A paste is never "the text" — copying a cell from a spreadsheet delivers
   text/html, text/plain and often an image/png at once, and reading only
   text/plain silently discards the structure the user copied. */
(() => {
  const fmt = (n) => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';

  document.querySelectorAll('[data-pdi]').forEach((root) => {
    const zone = root.querySelector('[data-pdi-zone]');
    const list = root.querySelector('[data-pdi-list]');
    const note = root.querySelector('[data-pdi-note]');

    const row = (mime, size, kind, peek) => {
      const li = document.createElement('li');
      li.className = 'pdi__row';
      li.innerHTML = '<span class="pdi__mime">' + mime + '</span>' +
        '<span class="pdi__size">' + (size == null ? '—' : fmt(size)) + '</span>' +
        '<span class="pdi__kind">' + kind + '</span>';
      if (peek) {
        const p = document.createElement('p');
        p.className = 'pdi__peek';
        p.textContent = peek.slice(0, 220);
        li.append(p);
      }
      list.append(li);
      return li;
    };

    const show = async (dt, label) => {
      list.replaceChildren();
      const items = [...(dt.items || [])];
      const types = [...(dt.types || [])];

      // Strings first, with their real byte length, not their character count.
      for (const t of types) {
        if (t === 'Files') continue;
        const data = dt.getData(t);
        row(t, new TextEncoder().encode(data).length, 'string', data);
      }

      /* webkitGetAsEntry is the only way to see a dropped DIRECTORY. The Files
         list contains nothing for a folder, so a drop handler reading only
         dataTransfer.files reports "no files" for a folder full of them. */
      const entries = items.map((i) => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
      const dirs = entries.filter((e) => e.isDirectory);

      for (const it of items) {
        if (it.kind !== 'file') continue;
        const f = it.getAsFile();
        if (f && !dirs.length) row(f.type || 'application/octet-stream', f.size, 'file', f.name);
      }

      for (const dir of dirs) {
        const li = row(dir.name + '/', null, 'directory', null);
        const tree = document.createElement('div');
        tree.className = 'pdi__tree';
        tree.textContent = 'reading…';
        li.append(tree);
        const lines = [];
        const walk = (entry, depth) => new Promise((res) => {
          if (depth > 3) return res();
          if (entry.isFile) { lines.push('  '.repeat(depth) + entry.name); return res(); }
          const reader = entry.createReader();
          const batch = () => reader.readEntries(async (es) => {
            // readEntries returns at most 100 per call — it must be called
            // repeatedly until it returns empty, or large folders truncate.
            if (!es.length) return res();
            for (const e of es) { lines.push('  '.repeat(depth) + e.name + (e.isDirectory ? '/' : '')); if (e.isDirectory) await walk(e, depth + 1); }
            batch();
          }, () => res());
          batch();
        });
        await walk(dir, 0);
        tree.textContent = lines.slice(0, 40).join('\n') || '(empty)';
      }

      note.textContent = label + ' — ' + types.length + ' flavour' + (types.length === 1 ? '' : 's') +
        (dirs.length ? ', ' + dirs.length + ' directory' : '') +
        (types.length > 1 ? '. Reading only text/plain would have discarded the rest.' : '.');
    };

    zone.addEventListener('paste', (e) => { e.preventDefault(); show(e.clipboardData, 'pasted'); });
    document.addEventListener('paste', (e) => {
      if (document.activeElement !== zone) return;
      e.preventDefault(); show(e.clipboardData, 'pasted');
    });

    for (const ev of ['dragenter', 'dragover']) {
      zone.addEventListener(ev, (e) => { e.preventDefault(); root.dataset.over = ''; });
    }
    for (const ev of ['dragleave', 'drop']) {
      zone.addEventListener(ev, () => root.removeAttribute('data-over'));
    }
    zone.addEventListener('drop', (e) => { e.preventDefault(); show(e.dataTransfer, 'dropped'); });

    note.textContent = 'Nothing inspected yet. Copy a cell from a spreadsheet for the clearest result.';
  });
})();
