/* Press the combination you want and it captures it. The hard parts are
   capturing before the browser acts, refusing combinations that are already
   taken by name, and rejecting a modifier on its own. */
(() => {
  const TAKEN = {
    'Ctrl+W': 'Close tab', 'Ctrl+T': 'New tab', 'Ctrl+N': 'New window',
    'Ctrl+Shift+Q': 'Quit', 'Ctrl+P': 'Print', 'Ctrl+S': 'Save page',
    'Meta+Q': 'Quit', 'Ctrl+F': 'Find in page'
  };
  const PRETTY = { Control: 'Ctrl', Meta: 'Meta', Alt: 'Alt', Shift: 'Shift', ' ': 'Space',
                   ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc' };

  document.querySelectorAll('[data-sr]').forEach((root) => {
    const field = root.querySelector('[data-sr-field]');
    const keys = root.querySelector('[data-sr-keys]');
    const note = root.querySelector('[data-sr-note]');
    const taken = root.querySelector('[data-sr-taken]');
    let listening = false;

    function combo(e) {
      const mods = [];
      if (e.ctrlKey) mods.push('Ctrl');
      if (e.metaKey) mods.push('Meta');
      if (e.altKey) mods.push('Alt');
      if (e.shiftKey) mods.push('Shift');
      const k = e.key;
      // A modifier alone is not a binding; keep listening rather than accepting it.
      if (['Control', 'Meta', 'Alt', 'Shift'].includes(k)) return { partial: mods.join(' + ') };
      const name = PRETTY[k] || (k.length === 1 ? k.toUpperCase() : k);
      return { combo: [...mods, name].join('+'), label: [...mods, name].join(' + ') };
    }

    function start() {
      listening = true;
      root.dataset.listening = 'true';
      keys.textContent = 'Press keys…';
      note.textContent = 'Listening. Escape cancels, Backspace clears.';
      taken.hidden = true;
      // Capture phase, so the combination is seen before anything else reacts.
      document.addEventListener('keydown', onKey, true);
    }

    function stop() {
      listening = false;
      root.dataset.listening = 'false';
      note.textContent = 'Click, then press the combination you want.';
      document.removeEventListener('keydown', onKey, true);
    }

    function onKey(e) {
      if (!listening) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') { keys.textContent = field.dataset.current || 'Ctrl + K'; stop(); return; }
      if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        keys.textContent = 'None'; field.dataset.current = 'None'; stop(); return;
      }

      const c = combo(e);
      if (c.partial !== undefined) { keys.textContent = (c.partial || '') + ' …'; return; }

      const conflict = TAKEN[c.combo];
      if (conflict) {
        // Name the binding it would break rather than refusing silently.
        taken.hidden = false;
        taken.textContent = c.label + ' is already ' + conflict + ' in the browser. Pick another.';
        keys.textContent = 'Press keys…';
        return;
      }

      keys.textContent = c.label;
      field.dataset.current = c.label;
      taken.hidden = true;
      root.dispatchEvent(new CustomEvent('sr:bind', { detail: c.combo, bubbles: true }));
      stop();
    }

    field.addEventListener('click', () => (listening ? stop() : start()));
    field.addEventListener('blur', () => { if (listening) stop(); });
  });
})();
