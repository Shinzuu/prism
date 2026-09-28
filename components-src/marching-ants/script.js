/* The crawl is entirely CSS. This only drives the demo's state changes and the
   single announcement, so the technique stays visible in the stylesheet. */
(() => {
  document.querySelectorAll('[data-ma]').forEach((root) => {
    const items = [...root.querySelectorAll('.ma__row')];
    const sr = root.querySelector('[data-ma-sr]');

    function busyCount() {
      return items.filter((i) => i.getAttribute('aria-busy') === 'true').length;
    }

    function finish(item) {
      if (item.getAttribute('aria-busy') !== 'true') return;
      item.removeAttribute('aria-busy');
      item.querySelector('[data-ma-state]').textContent = 'done';
      const left = busyCount();
      // One announcement per completion, not one per frame of the animation.
      sr.textContent = left ? `${left} item${left === 1 ? '' : 's'} still uploading.` : 'All uploads finished.';
      if (!left) setTimeout(reset, 2600);
    }

    function reset() {
      items.forEach((i, n) => {
        if (n === items.length - 1) return;
        i.setAttribute('aria-busy', 'true');
        i.querySelector('[data-ma-state]').textContent = 'uploading';
      });
      sr.textContent = `${busyCount()} items uploading.`;
      queue();
    }

    let timers = [];
    function queue() {
      timers.forEach(clearTimeout);
      timers = items
        .filter((i) => i.getAttribute('aria-busy') === 'true')
        .map((i, n) => setTimeout(() => finish(i), 2400 + n * 1800));
    }

    queue();
  });
})();
