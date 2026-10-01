/* prism navigation memory

   This is a multi-page site, so every link is a real document load. The browser
   is supposed to put you back where you were when you press Back, and on a
   phone it frequently does not: the library restores before its lazy preview
   frames and its view-timeline animations have settled, the document is shorter
   than it will be a frame later, and the restore clamps to the top. You lose
   your place in a seventy-tile grid.

   So the position is kept here as well, and re-applied until it sticks. The
   browser's own restore is left switched on — this only intervenes when that
   restore visibly failed. */
(() => {
  const SCROLL = 'prism:pos:';
  const FROM = 'prism:from';
  const QUERY = 'prism:q';

  /* Private windows throw on the first touch of sessionStorage rather than
     returning null, so every access goes through these. */
  const read = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* not fatal */ } };
  const drop = (k) => { try { sessionStorage.removeItem(k); } catch { /* not fatal */ } };

  /* Keyed on the path alone. The library's ?q= is restored separately, and a
     position should survive the filter being cleared. */
  const key = SCROLL + location.pathname;

  const nav = performance.getEntriesByType('navigation')[0];
  let back = nav ? nav.type === 'back_forward' : false;

  // ---- how tall the sticky masthead is ------------------------------------

  /* Anchor jumps and scrollIntoView both need to clear the masthead, and it is
     a different height on a phone than on a laptop. Measuring beats guessing:
     the guess was one fixed value, and it put section headings under the bar. */
  const mast = document.querySelector('.mast');
  if (mast) {
    /* On a phone the masthead sticks at a negative top, so its first row
       scrolls away and only the menu stays pinned. What covers the page is
       the height plus that offset, not the height. */
    const measure = () => {
      const top = Number.parseFloat(getComputedStyle(mast).top) || 0;
      document.documentElement.style.setProperty('--mast-h', `${Math.round(mast.offsetHeight + Math.min(top, 0))}px`);
    };
    measure();
    if (window.ResizeObserver) new ResizeObserver(measure).observe(mast);
    else addEventListener('resize', measure);
  }

  // ---- remember -----------------------------------------------------------

  let pending = 0;
  function save() {
    pending = 0;
    const y = Math.round(scrollY);
    if (y > 0) write(key, String(y)); else drop(key);
  }
  addEventListener('scroll', () => {
    if (pending) return;
    pending = requestAnimationFrame(save);
  }, { passive: true });
  addEventListener('pagehide', save);
  addEventListener('visibilitychange', () => { if (document.hidden) save(); });

  /* Which card was opened, so the library can mark it on the way back. A phone
     screen shows three or four tiles at a time; without the mark you cannot
     tell which of them you already looked at. */
  addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const m = href.match(/^\/components\/([\w-]+)$/);
    if (m) write(FROM, m[1]);
  }, { capture: true });

  // ---- put it back --------------------------------------------------------

  const want = Number(read(key) || 0);
  let userMoved = false;
  addEventListener('wheel', () => { userMoved = true; }, { passive: true, once: true });
  addEventListener('touchmove', () => { userMoved = true; }, { passive: true, once: true });
  addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) userMoved = true;
  }, { once: true });

  function settle() {
    if (!back || !want || userMoved) return;
    if (Math.abs(scrollY - want) < 4) return;
    /* Only push down to a position the document can actually hold. If the page
       is still growing, a later pass gets closer. */
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: Math.min(want, Math.max(0, max)), behavior: 'instant' });
  }

  if (back && want) {
    /* Three passes, because three different things finish at three different
       times: layout, web fonts, and the preview iframes. */
    requestAnimationFrame(() => requestAnimationFrame(settle));
    addEventListener('load', () => { settle(); setTimeout(settle, 120); });
    setTimeout(settle, 400);
  }

  /* A bfcache restore arrives with the DOM and the scroll position intact, and
     nothing here should touch it. */
  addEventListener('pageshow', (e) => { if (e.persisted) { userMoved = true; back = false; } });

  // ---- the library's filter, and the tile you came from -------------------

  const q = document.getElementById('q');
  if (q) {
    const url = new URL(location.href);
    const fromUrl = url.searchParams.get('q');
    const fromStore = back ? read(QUERY) : null;
    const term = fromUrl ?? fromStore;

    if (term) {
      q.value = term;
      q.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /* The term lives in the URL so the filtered view is the thing that gets
       shared and the thing Back returns to. replaceState, not pushState: typing
       should not build a history entry per keystroke. */
    let t = 0;
    q.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const u = new URL(location.href);
        if (q.value.trim()) { u.searchParams.set('q', q.value.trim()); write(QUERY, q.value.trim()); }
        else { u.searchParams.delete('q'); drop(QUERY); }
        history.replaceState(history.state, '', u);
      }, 250);
    });

    const from = read(FROM);
    if (from && back) {
      const tile = document.querySelector(`a.tile__in[href="/components/${from}"]`)?.closest('.tile');
      if (tile) {
        tile.classList.add('tile--seen');
        /* If the stored position is gone — a fresh tab, or a filter that moved
           everything — the tile itself is the anchor. */
        if (!want) {
          requestAnimationFrame(() => tile.scrollIntoView({ block: 'center', behavior: 'instant' }));
        }
      }
    }
  }

  // ---- back, forward, and up ---------------------------------------------

  /* The bar's back control returns through history when there is history to
     return through, so the library comes back with its scroll and its filter.
     Its href is a real URL, so it still works on a cold load or a shared link. */
  document.querySelectorAll('[data-back]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const sameSite = document.referrer && new URL(document.referrer, location.href).origin === location.origin;
      if (sameSite && history.length > 1) { e.preventDefault(); history.back(); }
    });
  });

  /* Left and right move between components, the way they move between photos.
     Not while typing, and not while a modifier is held. */
  const prev = document.querySelector('[data-nav-prev]');
  const next = document.querySelector('[data-nav-next]');
  if (prev || next) {
    addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); location.href = prev.href; }
      if (e.key === 'ArrowRight' && next) { e.preventDefault(); location.href = next.href; }
    });
  }

  /* One way back up a long page. Component pages run to several thousand
     pixels on a phone, and the masthead scrolls with them. */
  const top = document.querySelector('[data-top]');
  if (top) {
    top.addEventListener('click', () => {
      scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    const show = () => top.toggleAttribute('data-on', scrollY > innerHeight);
    addEventListener('scroll', () => requestAnimationFrame(show), { passive: true });
    show();
  }
})();
