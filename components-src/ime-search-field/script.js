/* A search field that waits for the composed word.
   Typing 你好 on a pinyin IME produces the intermediate letters n-i-h-a-o as
   real input events. A field that queries on every input searches "nihao",
   which matches nothing, five times — and the bug is invisible to anyone
   testing in a Latin script. */
(() => {
  document.querySelectorAll('[data-ime]').forEach((root) => {
    const input = root.querySelector('[data-ime-input]');
    const state = root.querySelector('[data-ime-state]');
    const good = root.querySelector('[data-ime-good]');
    const bad = root.querySelector('[data-ime-bad]');
    const sim = root.querySelector('[data-ime-sim]');

    let composing = false;
    let timer = null;

    const push = (list, text, hit) => {
      const li = document.createElement('li');
      li.innerHTML = hit ? '<b>' + text + '</b>' : text;
      list.prepend(li);
      while (list.children.length > 6) list.lastElementChild.remove();
    };

    const query = (value, list) => {
      if (!value) return;
      push(list, 'GET /search?q=' + value, true);
    };

    // The naive version, shown side by side so the cost is visible.
    const naive = () => query(input.value, bad);

    const guarded = () => {
      /* Two independent guards, and both are needed. compositionstart and
         compositionend bracket the composition; event.isComposing catches the
         input event that fires BEFORE compositionend in Safari and Firefox,
         which the flag alone would let through. */
      if (composing) return;
      clearTimeout(timer);
      timer = setTimeout(() => query(input.value, good), 140);
    };

    input.addEventListener('compositionstart', () => {
      composing = true;
      root.dataset.imeComposing = '';
      state.textContent = 'composing';
    });

    input.addEventListener('compositionend', () => {
      composing = false;
      root.removeAttribute('data-ime-composing');
      state.textContent = 'idle';
      // The composed word is only final here, so this is the one real query.
      guarded();
    });

    input.addEventListener('input', (e) => {
      state.textContent = e.isComposing ? 'composing' : 'typing';
      naive();
      if (e.isComposing) return;   // belt as well as braces
      guarded();
    });

    // Replay a pinyin composition so the difference is visible without an IME.
    sim.addEventListener('click', () => {
      const steps = ['n', 'ni', 'nih', 'niha', 'nihao'];
      input.value = '';
      good.replaceChildren(); bad.replaceChildren();
      input.dispatchEvent(new CompositionEvent('compositionstart'));
      root.dataset.imeComposing = '';
      state.textContent = 'composing';

      steps.forEach((s, i) => setTimeout(() => {
        input.value = s;
        composing = true;
        // isComposing is read-only and true only for real IME input, so the
        // simulation calls the two paths directly rather than faking the flag.
        naive();
        if (i === steps.length - 1) {
          setTimeout(() => {
            input.value = '你好';
            naive();
            /* Dispatching compositionend is enough: the real listener above
               clears the flag and fires the one guarded query. Calling query()
               here as well is how the demo ends up claiming two requests. */
            input.dispatchEvent(new CompositionEvent('compositionend', { data: '你好' }));
          }, 170);
        }
      }, 170 * i));
    });
  });
})();
