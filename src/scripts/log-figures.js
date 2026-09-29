/* Grow the figure bars when the figure reaches the reader, not on load: a
   chart that finished animating before anyone looked at it may as well be a
   static image.

   The bars are written at their final width in the markup, so the page is
   correct with this script removed. The script's first act is to collapse
   them, which is only safe if something is guaranteed to grow them again —
   hence the fallback at the bottom. An animation that fails open leaves a
   chart with no bars, and that is a worse chart than one that never moved. */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const figures = document.querySelectorAll('[data-fig]');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (figures.length && !still) {
  for (const fig of figures) {
    const bars = fig.querySelectorAll('.fig__track i');
    if (!bars.length) continue;

    gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });
    const grow = gsap.to(bars, {
      scaleX: 1,
      duration: 0.75,
      ease: 'power3.out',
      stagger: 0.06,
      scrollTrigger: { trigger: fig, start: 'top 85%', once: true },
    });

    /* If the trigger has not fired within two seconds — a stale layout, a
       measurement taken before fonts settle, anything — show the chart. */
    setTimeout(() => {
      if (grow.progress() === 0 && !grow.isActive()) gsap.set(bars, { scaleX: 1 });
    }, 2000);
  }
}
