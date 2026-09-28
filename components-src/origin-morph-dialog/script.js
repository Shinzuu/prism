/* A dialog that grows out of the row that opened it. The row's content becomes
   the dialog's header, so you never lose your place in the list.
   The whole thing hinges on view-transition-name being UNIQUE at capture time:
   two elements sharing one name aborts the transition with a console error and
   no animation, so the name is assigned to one row immediately before the
   snapshot and removed immediately after. */
(() => {
  const supported = typeof document.startViewTransition === 'function';

  document.querySelectorAll('[data-omd]').forEach((root) => {
    const dlg = root.querySelector('[data-omd-dlg]');
    const head = root.querySelector('[data-omd-head]');
    let activeRow = null;

    const name = (el, value) => {
      if (el) el.style.viewTransitionName = value || '';
    };

    const open = (row) => {
      const btn = row.querySelector('[data-omd-open]');
      head.innerHTML = btn.innerHTML;

      const run = () => {
        dlg.showModal();
        name(row, '');
        name(head, 'omd-card');
      };

      if (!supported) { dlg.showModal(); return; }   // opens plainly, no error

      activeRow = row;
      name(row, 'omd-card');
      const t = document.startViewTransition(run);
      t.finished.finally(() => { name(head, ''); name(row, ''); });
    };

    const close = () => {
      const row = activeRow;
      const run = () => {
        dlg.close();
        name(head, '');
        name(row, 'omd-card');
      };
      if (!supported) { dlg.close(); return; }
      name(head, 'omd-card');
      const t = document.startViewTransition(run);
      t.finished.finally(() => { name(row, ''); name(head, ''); activeRow = null; });
    };

    for (const btn of root.querySelectorAll('[data-omd-open]')) {
      btn.addEventListener('click', () => open(btn.closest('[data-omd-row]')));
    }
    root.querySelector('[data-omd-close]').addEventListener('click', close);

    // Esc closes the dialog natively; mirror it so the names are cleaned up.
    dlg.addEventListener('close', () => { name(activeRow, ''); name(head, ''); activeRow = null; });
  });
})();
