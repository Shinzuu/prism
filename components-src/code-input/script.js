/* Six-slot verification code input.
   The hard parts are not the boxes: they are paste across all slots, backspace
   into the previous slot, arrow navigation, and mobile autofill delivering the
   whole code into one field. */
(() => {
  const LENGTH = 6;
  const digits = (s) => (s.match(/\d/g) || []).join('');

  document.querySelectorAll('[data-ci]').forEach((form) => {
    const slots = [...form.querySelectorAll('.ci__slot')];
    const status = form.querySelector('[data-ci-status]');

    const value = () => slots.map((s) => s.value).join('');

    function mark() {
      slots.forEach((s) => { s.dataset.filled = String(s.value !== ''); });
      const v = value();
      if (v.length < LENGTH) { form.dataset.state = ''; status.textContent = ''; return; }
      // Stand-in for a real check. Anything but 000000 is accepted.
      const ok = v !== '000000';
      form.dataset.state = ok ? 'done' : 'bad';
      status.textContent = ok ? 'Code accepted.' : 'That code is not valid. Check and try again.';
      if (!ok) { slots[0].focus(); slots.forEach((s) => { s.value = ''; s.dataset.filled = 'false'; }); }
    }

    function fill(from, text) {
      const d = digits(text);
      if (!d) return;
      for (let i = 0; i < d.length && from + i < LENGTH; i++) slots[from + i].value = d[i];
      const next = Math.min(from + d.length, LENGTH - 1);
      slots[next].focus();
      slots[next].select();
      mark();
    }

    slots.forEach((slot, i) => {
      slot.addEventListener('input', () => {
        // Autofill and some keyboards deliver the whole code into one slot.
        if (slot.value.length > 1) return fill(i, slot.value);
        slot.value = digits(slot.value).slice(0, 1);
        if (slot.value && i < LENGTH - 1) slots[i + 1].focus();
        mark();
      });

      slot.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !slot.value && i > 0) {
          e.preventDefault();
          slots[i - 1].value = '';
          slots[i - 1].focus();
          mark();
        } else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); slots[i - 1].focus(); }
        else if (e.key === 'ArrowRight' && i < LENGTH - 1) { e.preventDefault(); slots[i + 1].focus(); }
      });

      slot.addEventListener('paste', (e) => {
        e.preventDefault();
        fill(i, (e.clipboardData || window.clipboardData).getData('text'));
      });

      slot.addEventListener('focus', () => slot.select());
    });

    form.addEventListener('submit', (e) => e.preventDefault());
  });
})();
