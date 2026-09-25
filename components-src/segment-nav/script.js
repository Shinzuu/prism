/* Segmented nav with one travelling indicator.
   Measurement is the whole job: the indicator must land correctly after fonts
   load, after the container resizes, and after the tab strip is scrolled. */
(() => {
  document.querySelectorAll('[data-sn]').forEach((nav) => {
    const items = [...nav.querySelectorAll('.sn__item')];
    const bar = nav.querySelector('.sn__indicator');
    let current = items.findIndex((i) => i.getAttribute('aria-current') === 'page');
    if (current < 0) current = 0;

    function place(animate = true) {
      const el = items[current];
      if (!el) return;
      if (!animate) bar.style.transition = 'none';
      bar.style.setProperty('--w', el.offsetWidth + 'px');
      bar.style.setProperty('--x', el.offsetLeft + 'px');
      bar.style.setProperty('--ready', '1');
      if (!animate) requestAnimationFrame(() => { bar.style.transition = ''; });
    }

    function select(i) {
      if (i === current) return;
      items[current]?.removeAttribute('aria-current');
      current = i;
      items[current].setAttribute('aria-current', 'page');
      place();
      nav.dispatchEvent(new CustomEvent('sn:change', { detail: items[i].textContent, bubbles: true }));
    }

    items.forEach((item, i) => {
      item.addEventListener('click', () => select(i));
      item.addEventListener('keydown', (e) => {
        const last = items.length - 1;
        let to = null;
        if (e.key === 'ArrowRight') to = i === last ? 0 : i + 1;
        else if (e.key === 'ArrowLeft') to = i === 0 ? last : i - 1;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = last;
        if (to === null) return;
        e.preventDefault();
        items[to].focus();
        select(to);
      });
    });

    // Width changes with the container, and with the font once it arrives.
    new ResizeObserver(() => place(false)).observe(nav);
    if (document.fonts?.ready) document.fonts.ready.then(() => place(false));
    nav.addEventListener('scroll', () => place(false), { passive: true });

    place(false);
  });
})();
