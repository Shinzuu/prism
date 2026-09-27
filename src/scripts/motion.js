import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(DrawSVGPlugin, Flip);

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Smooth scroll was removed deliberately. Lenis hijacks the scroll thread to
   reproduce something the browser already does, and on a low-end device the
   cost lands exactly where the user notices it. */

/* ---------- hero ---------- */
function hero() {
  const svg = document.querySelector('.hero__plate svg');
  if (!svg) return;

  const lines = document.querySelectorAll('.hero__say h1 i');
  /* Every painted class must appear here or it never draws. */
  const order = ['.hull', '.radome', '.glove', '.nacelle', '.wing .ln', '.fin',
                 '.stab', '.pylon', '.nozzle', '.canopy', '.detail'];

  if (REDUCED) {
    gsap.set('.craft .ln, .rules line, .rules circle, .marks path, .note__lead', { opacity: 1, drawSVG: '100%' });
    gsap.set('.note__dot, .note__n, .note__t', { opacity: 1, scale: 1 });
    gsap.set('.craft .ln', { fillOpacity: 1 });
    gsap.set(lines, { yPercent: 0 });
    gsap.set('.hero__lead, .hero__meta', { opacity: 1, y: 0 });
    return;
  }

  gsap.set('.craft .ln', { drawSVG: '0%', fillOpacity: 0 });
  gsap.set('.rules line, .rules circle, .marks path', { opacity: 0 });
  gsap.set('.note__dot, .note__n, .note__t', { opacity: 0 });
  gsap.set(lines, { yPercent: 115 });
  gsap.set('.hero__lead, .hero__meta', { opacity: 0, y: 14 });

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

  tl.to('.rules line, .rules circle', { opacity: 1, duration: .5, stagger: .04 }, 0)
    .to(lines, { yPercent: 0, duration: .9, stagger: .085, ease: 'expo.out' }, .18);

  order.forEach((sel, i) => {
    tl.to(sel, { drawSVG: '100%', duration: .85, ease: 'power1.inOut' }, .3 + i * 0.1)
      .to(sel, { fillOpacity: 1, duration: .5 }, .3 + i * 0.1 + .55);
  });

  tl.to('.hero__lead', { opacity: 1, y: 0, duration: .6 }, .75)
    .to('.hero__meta', { opacity: 1, y: 0, duration: .5 }, .88)
    .to('.marks path', { opacity: 1, duration: .4 }, 1.5)


  /* Once the airframe exists, annotate it: each leader draws out from its point
     on the drawing and the label arrives behind it, one subsystem at a time. */
  gsap.utils.toArray('.note').forEach((note, i) => {
    const at = 1.45 + i * 0.26;
    tl.fromTo(note.querySelector('.note__dot'),
      { scale: 0, transformOrigin: '50% 50%' },
      { scale: 1, duration: .28, ease: 'back.out(2.4)' }, at)
      .fromTo(note.querySelector('.note__lead'),
        { drawSVG: '0%' }, { drawSVG: '100%', duration: .42, ease: 'power2.inOut' }, at + .06)
      .fromTo(note.querySelectorAll('.note__n, .note__t'),
        { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: .36, stagger: .04 }, at + .3);
  });


}

/* ---------- library: Flip on filter ---------- */
function library() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  const cells = [...grid.querySelectorAll('.cell')];

  window.prismFilter = (predicate) => {
    if (REDUCED) {
      cells.forEach((c) => { c.hidden = !predicate(c); });
      return;
    }
    const state = Flip.getState(cells, { props: 'opacity' });
    cells.forEach((c) => { c.hidden = !predicate(c); });
    Flip.from(state, {
      duration: .55,
      ease: 'power3.inOut',
      stagger: .014,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .45 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: .92, duration: .3 })
    });
  };


}

hero();
library();

