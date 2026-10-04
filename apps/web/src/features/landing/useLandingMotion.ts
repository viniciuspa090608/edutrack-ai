import { useEffect, type RefObject } from 'react';

/** Progressive decoration: no hidden content or React updates on pointer movement. */
export function useLandingMotion(
  page: RefObject<HTMLDivElement | null>,
  hero: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const root = page.current;
    const visual = hero.current;
    if (!root || !visual || typeof window.matchMedia !== 'function') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let observer: IntersectionObserver | undefined;
    const revealed = new WeakSet<Element>();
    let frame = 0;
    let x = 0,
      y = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      visual.style.removeProperty('--hero-x');
      visual.style.removeProperty('--hero-y');
    };
    const move = (event: PointerEvent) => {
      if (reduced.matches || !pointer.matches) return;
      const bounds = visual.getBoundingClientRect();
      x = Math.max(
        -6,
        Math.min(6, ((event.clientX - bounds.left) / bounds.width - 0.5) * 12),
      );
      y = Math.max(
        -6,
        Math.min(6, ((event.clientY - bounds.top) / bounds.height - 0.5) * 12),
      );
      if (frame) return;
      frame = requestAnimationFrame(() => {
        visual.style.setProperty('--hero-x', `${x}px`);
        visual.style.setProperty('--hero-y', `${y}px`);
        frame = 0;
      });
    };
    const setup = () => {
      observer?.disconnect();
      root
        .querySelectorAll('.landing-enter')
        .forEach((element) => element.classList.remove('landing-enter'));
      reset();
      if (reduced.matches || typeof IntersectionObserver !== 'function') return;
      try {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries)
              if (entry.isIntersecting) {
                revealed.add(entry.target);
                entry.target.classList.add('landing-enter');
                observer?.unobserve(entry.target);
              }
          },
          { threshold: 0.12 },
        );
        root.querySelectorAll('[data-reveal]').forEach((element) => {
          if (!revealed.has(element)) observer?.observe(element);
        });
      } catch {
        observer?.disconnect();
        // Decoration can fail without hiding or unmounting the content.
      }
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest('[data-reveal]');
      if (element) {
        revealed.add(element);
        element.classList.remove('landing-enter');
        observer?.unobserve(element);
      }
    };
    setup();
    reduced.addEventListener('change', setup);
    pointer.addEventListener('change', reset);
    visual.addEventListener('pointermove', move);
    visual.addEventListener('pointerleave', reset);
    root.addEventListener('focusin', focus);
    document.documentElement.classList.add('landing-scroll');
    return () => {
      reset();
      observer?.disconnect();
      reduced.removeEventListener('change', setup);
      pointer.removeEventListener('change', reset);
      visual.removeEventListener('pointermove', move);
      visual.removeEventListener('pointerleave', reset);
      root.removeEventListener('focusin', focus);
      document.documentElement.classList.remove('landing-scroll');
    };
  }, [page, hero]);
}
