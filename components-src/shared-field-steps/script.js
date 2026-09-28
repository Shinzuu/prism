/* Between steps, the fields that persist GLIDE to their new positions while
   only the genuinely new ones fade in. Cross-fading the whole panel tells the
   user every field was replaced, including the three that did not change, and
   it throws away the one piece of continuity a multi-step form has. */
(() => {
  const STEPS = [
    { title: 'Who is travelling', fields: ['name', 'email'] },
    { title: 'Where to', fields: ['name', 'email', 'city', 'dates'] },
    { title: 'Confirm', fields: ['name', 'email', 'city'] },
  ];
  const LABELS = { name: 'Full name', email: 'Email', city: 'Destination city', dates: 'Travel dates' };

  document.querySelectorAll('[data-sfs]').forEach((form) => {
    const host = form.querySelector('[data-sfs-fields]');
    const head = form.querySelector('[data-sfs-h]');
    const dots = form.querySelector('[data-sfs-dots]');
    const prev = form.querySelector('[data-sfs-prev]');
    const next = form.querySelector('[data-sfs-next]');
    const values = {};
    let step = 0;

    dots.replaceChildren(...STEPS.map(() => document.createElement('li')));

    const render = (dir) => {
      // FIRST: where the surviving fields are now.
      const first = new Map();
      for (const el of host.querySelectorAll('[data-key]')) {
        first.set(el.dataset.key, el.getBoundingClientRect().top);
        values[el.dataset.key] = el.querySelector('input').value;
      }

      host.replaceChildren();
      for (const key of STEPS[step].fields) {
        const wrap = document.createElement('div');
        wrap.className = 'sfs__f';
        wrap.dataset.key = key;
        const id = 'sfs-' + key;
        wrap.innerHTML = '<label class="sfs__lab" for="' + id + '">' + LABELS[key] + '</label>';
        const input = document.createElement('input');
        input.className = 'sfs__in'; input.id = id; input.name = key; input.type = 'text';
        input.value = values[key] || '';
        wrap.append(input);
        host.append(wrap);
      }

      head.textContent = 'Step ' + (step + 1) + ' of ' + STEPS.length + ' — ' + STEPS[step].title;
      [...dots.children].forEach((d, i) => { if (i <= step) d.dataset.on = ''; else d.removeAttribute('data-on'); });
      prev.disabled = step === 0;
      next.textContent = step === STEPS.length - 1 ? 'Submit' : 'Continue';

      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      for (const el of host.querySelectorAll('[data-key]')) {
        const was = first.get(el.dataset.key);
        if (was == null) {
          el.dataset.new = '';        // genuinely new: it may fade
          continue;
        }
        if (reduced) continue;
        // LAST / INVERT / PLAY for the fields that persist across the step.
        const now = el.getBoundingClientRect().top;
        const dy = was - now;
        if (!dy) continue;
        el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }],
          { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    };

    next.addEventListener('click', () => {
      if (step < STEPS.length - 1) { step++; render(1); }
      else head.textContent = 'Submitted — ' + Object.entries(values)
        .filter(([, v]) => v).map(([k]) => LABELS[k]).join(', ');
    });
    prev.addEventListener('click', () => { if (step > 0) { step--; render(-1); } });
    form.addEventListener('submit', (e) => e.preventDefault());

    render(0);
  });
})();
