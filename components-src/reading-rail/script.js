/* A table of contents that tracks reading position. The hard part is that
   "which heading is current" has no single right answer while two are on
   screen, and naive implementations flicker between them at every boundary. */
(() => {
  document.querySelectorAll('[data-rr]').forEach((root) => {
    const doc = root.querySelector('[data-rr-doc]');
    const list = root.querySelector('[data-rr-list]');
    const line = root.querySelector('[data-rr-line]');
    const heads = [...doc.querySelectorAll('h3')];
    const links = [];

    heads.forEach((h) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        doc.scrollTo({ top: h.offsetTop - doc.offsetTop - 4, behavior: 'smooth' });
      });
      li.append(a); list.append(li); links.push(a);
    });

    let current = -1;

    function mark(i) {
      if (i === current || i < 0) return;
      current = i;
      links.forEach((a, n) => a.setAttribute('aria-current', String(n === i)));
      const a = links[i];
      line.style.setProperty('--top', a.offsetTop + 'px');
      line.style.setProperty('--h', a.offsetHeight + 'px');
    }

    /* The last heading whose top has passed the reading line is current.
       Using "topmost visible heading" instead makes the marker flicker every
       time a heading straddles the boundary. */
    function update() {
      const line_y = doc.scrollTop + doc.clientHeight * 0.28;
      let i = 0;
      heads.forEach((h, n) => { if (h.offsetTop - doc.offsetTop <= line_y) i = n; });
      // At the very bottom the last section is current even if its heading is above the line.
      if (doc.scrollTop + doc.clientHeight >= doc.scrollHeight - 4) i = heads.length - 1;
      mark(i);
    }

    doc.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update);
    update();
  });
})();
