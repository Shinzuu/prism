/* Command palette: fuzzy filter, roving aria-activedescendant, focus trap,
   focus restored to the opener on close. No dependencies. */
(() => {
  const COMMANDS = [
    { label: 'New file',            hint: 'Ctrl N' },
    { label: 'Open recent',         hint: 'Ctrl R' },
    { label: 'Search in project',   hint: 'Ctrl Shift F' },
    { label: 'Toggle dark mode',    hint: 'Ctrl D' },
    { label: 'Go to definition',    hint: 'F12' },
    { label: 'Format document',     hint: 'Alt Shift F' },
    { label: 'Split editor right',  hint: 'Ctrl \\' },
    { label: 'Close all tabs',      hint: '' }
  ];

  document.querySelectorAll('[data-cp]').forEach((root) => {
    const trigger = root.querySelector('[data-cp-open]');
    const scrim   = root.querySelector('[data-cp-scrim]');
    const panel   = root.querySelector('[data-cp-panel]');
    const input   = root.querySelector('[data-cp-input]');
    const list    = root.querySelector('[data-cp-list]');
    const empty   = root.querySelector('[data-cp-empty]');

    let matches = [];
    let active = 0;
    let lastFocused = null;

    /* subsequence match: "gtd" finds "Go to definition" */
    function score(query, label) {
      if (!query) return { hit: true, parts: [label] };
      const q = query.toLowerCase(), l = label.toLowerCase();
      const parts = [];
      let qi = 0, from = 0;
      for (let i = 0; i < l.length && qi < q.length; i++) {
        if (l[i] === q[qi]) {
          parts.push(label.slice(from, i), { m: label[i] });
          from = i + 1;
          qi++;
        }
      }
      if (qi < q.length) return { hit: false };
      parts.push(label.slice(from));
      return { hit: true, parts };
    }

    function render() {
      const q = input.value.trim();
      matches = COMMANDS.map(c => ({ ...c, ...score(q, c.label) })).filter(c => c.hit);
      if (active >= matches.length) active = Math.max(0, matches.length - 1);

      list.textContent = '';
      matches.forEach((m, i) => {
        const li = document.createElement('li');
        li.className = 'cp__opt';
        li.id = `cp-opt-${i}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === active));

        const text = document.createElement('span');
        for (const p of m.parts) {
          if (typeof p === 'string') text.append(p);
          else { const mk = document.createElement('mark'); mk.textContent = p.m; text.append(mk); }
        }
        li.append(text);

        if (m.hint) {
          const hint = document.createElement('span');
          hint.className = 'cp__opt-hint';
          hint.textContent = m.hint;
          li.append(hint);
        }
        li.addEventListener('click', () => run(i));
        list.append(li);
      });

      empty.hidden = matches.length > 0;
      input.setAttribute('aria-activedescendant', matches.length ? `cp-opt-${active}` : '');
      const sel = list.children[active];
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    function move(delta) {
      if (!matches.length) return;
      active = (active + delta + matches.length) % matches.length;
      render();
    }

    function run(i) {
      const cmd = matches[i];
      close();
      if (cmd) root.dispatchEvent(new CustomEvent('cp:run', { detail: cmd.label, bubbles: true }));
    }

    function open() {
      lastFocused = document.activeElement;
      scrim.hidden = panel.hidden = false;
      input.value = '';
      active = 0;
      render();
      input.focus();
      document.addEventListener('keydown', onKey, true);
    }

    function close() {
      scrim.hidden = panel.hidden = true;
      document.removeEventListener('keydown', onKey, true);
      if (lastFocused && lastFocused.isConnected) lastFocused.focus();
    }

    function onKey(e) {
      if (panel.hidden) return;
      if (e.key === 'Escape')    { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter')     { e.preventDefault(); run(active); }
      else if (e.key === 'Tab')       { e.preventDefault(); input.focus(); } // trap
    }

    trigger.addEventListener('click', open);
    scrim.addEventListener('click', close);
    input.addEventListener('input', () => { active = 0; render(); });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        panel.hidden ? open() : close();
      }
    });
  });
})();
