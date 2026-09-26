/* Spreadsheet cell semantics. The grid is the easy part; the contract people
   already know from Excel is the component:
     arrows move      Enter commits and drops one row
     Tab commits and moves right, Shift+Tab left
     typing replaces  F2 or double-click edits in place
     Escape reverts   the cell you were editing, not the whole row */
(() => {
  document.querySelectorAll('[data-sg]').forEach((root) => {
    const rows = [...root.querySelectorAll('tbody tr')];
    const grid = rows.map((r) => [...r.querySelectorAll('td')]);
    const hint = root.querySelector('[data-sg-hint]');
    let r = 0, c = 0, editing = false, before = '';

    const cell = (y, x) => grid[y]?.[x];

    function focusCell(y, x) {
      const next = cell(y, x);
      if (!next) return;
      cell(r, c)?.setAttribute('tabindex', '-1');
      r = y; c = x;
      next.setAttribute('tabindex', '0');
      next.focus();
    }

    function startEdit(replace) {
      const el = cell(r, c);
      if (!el || editing) return;
      editing = true;
      before = el.textContent;
      el.dataset.editing = 'true';
      el.contentEditable = 'plaintext-only';
      if (replace !== undefined) el.textContent = replace;
      el.focus();
      const sel = getSelection(); const range = document.createRange();
      range.selectNodeContents(el);
      if (replace !== undefined) range.collapse(false);
      sel.removeAllRanges(); sel.addRange(range);
      hint.textContent = 'Editing · Enter commits · Escape reverts';
    }

    function endEdit(commit) {
      const el = cell(r, c);
      if (!el || !editing) return;
      editing = false;
      el.contentEditable = 'false';
      delete el.dataset.editing;
      if (!commit) el.textContent = before;
      else if (el.textContent !== before) el.dataset.dirty = 'true';
      hint.textContent = 'Type to replace · Enter to commit · Escape to cancel';
      el.focus();
    }

    root.addEventListener('keydown', (e) => {
      const k = e.key;

      if (editing) {
        if (k === 'Enter') { e.preventDefault(); endEdit(true); focusCell(r + 1, c); }
        else if (k === 'Escape') { e.preventDefault(); endEdit(false); }
        else if (k === 'Tab') { e.preventDefault(); endEdit(true); focusCell(r, c + (e.shiftKey ? -1 : 1)); }
        return;
      }

      if (k === 'ArrowDown') { e.preventDefault(); focusCell(r + 1, c); }
      else if (k === 'ArrowUp') { e.preventDefault(); focusCell(r - 1, c); }
      else if (k === 'ArrowLeft') { e.preventDefault(); focusCell(r, c - 1); }
      else if (k === 'ArrowRight') { e.preventDefault(); focusCell(r, c + 1); }
      else if (k === 'Enter') { e.preventDefault(); startEdit(); }
      else if (k === 'F2') { e.preventDefault(); startEdit(); }
      else if (k === 'Tab') { e.preventDefault(); focusCell(r, c + (e.shiftKey ? -1 : 1)); }
      else if (k === 'Home') { e.preventDefault(); focusCell(r, 0); }
      else if (k === 'End') { e.preventDefault(); focusCell(r, grid[r].length - 1); }
      else if (k === 'Delete' || k === 'Backspace') {
        e.preventDefault();
        const el = cell(r, c);
        if (el.textContent) { el.textContent = ''; el.dataset.dirty = 'true'; }
      }
      // A printable character replaces the cell, exactly as a spreadsheet does.
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        startEdit(k);
      }
    });

    grid.forEach((row, y) => row.forEach((el, x) => {
      el.addEventListener('mousedown', () => { if (!editing) focusCell(y, x); });
      el.addEventListener('dblclick', () => { focusCell(y, x); startEdit(); });
    }));
  });
})();
