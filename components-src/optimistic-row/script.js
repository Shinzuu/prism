/* Optimistic write: the row appears before the server confirms, and when the
   write fails it fails in place — keeping the user's text, saying why, and
   offering a retry — rather than vanishing and losing what they typed. */
(() => {
  const FAIL_RATE = 0.34;
  const LATENCY = [500, 1400];

  document.querySelectorAll('[data-or]').forEach((root) => {
    const form = root.querySelector('[data-or-form]');
    const input = root.querySelector('[data-or-input]');
    const list = root.querySelector('[data-or-list]');
    const sr = root.querySelector('[data-or-sr]');

    const write = (text) => new Promise((resolve, reject) => {
      const ms = LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]);
      setTimeout(() => (Math.random() < FAIL_RATE
        ? reject(new Error('The server rejected the write'))
        : resolve(text)), ms);
    });

    function row(text) {
      const li = document.createElement('li');
      li.dataset.state = 'pending';
      const span = document.createElement('span');
      span.textContent = text;
      const em = document.createElement('em');
      em.textContent = 'saving…';
      li.append(span, em);
      return li;
    }

    async function send(li, text) {
      li.dataset.state = 'pending';
      li.querySelector('em').textContent = 'saving…';
      try {
        await write(text);
        li.dataset.state = 'done';
        li.querySelector('em').textContent = 'confirmed';
        sr.textContent = text + ' saved.';
      } catch (err) {
        // Fail in place. The row stays, the text stays, the reason is stated.
        li.dataset.state = 'failed';
        const em = li.querySelector('em');
        em.textContent = '';
        const msg = document.createElement('span');
        msg.textContent = err.message + ' · ';
        msg.style.cssText = 'flex:none;font-family:var(--mono);font-size:.68rem';
        const retry = document.createElement('button');
        retry.type = 'button'; retry.className = 'or__retry'; retry.textContent = 'retry';
        retry.addEventListener('click', () => { em.textContent = ''; send(li, text); });
        const discard = document.createElement('button');
        discard.type = 'button'; discard.className = 'or__retry'; discard.textContent = 'discard';
        discard.style.marginLeft = '8px';
        discard.addEventListener('click', () => { li.remove(); sr.textContent = text + ' discarded.'; });
        em.append(msg, retry, discard);
        sr.textContent = text + ' failed to save. Retry or discard.';
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      const li = row(text);
      list.append(li);              // appears immediately, before the server knows
      send(li, text);
    });
  });
})();
