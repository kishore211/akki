import { trackNexusEvent } from './analytics';

export const initDataNexusParallax = async () => {
  if (document.documentElement.dataset.nexusParallaxReady === 'true') return;
  document.documentElement.dataset.nexusParallaxReady = 'true';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll<HTMLElement>('[data-parallax-layer]').forEach((layer) => {
      const depth = Number(layer.dataset.depth ?? '0.12');
      gsap.to(layer, {
        yPercent: depth * -100,
        ease: 'none',
        scrollTrigger: {
          trigger: layer.closest('[data-nexus-section]') ?? layer,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
  }

  const observedSections = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const section = entry.target as HTMLElement;
        if (!entry.isIntersecting || !section.id || observedSections.has(section.id)) return;

        observedSections.add(section.id);
        trackNexusEvent('section_viewed', { section: section.id });
      });
    },
    { threshold: 0.45 }
  );

  document.querySelectorAll<HTMLElement>('[data-nexus-section]').forEach((section) => observer.observe(section));
};
