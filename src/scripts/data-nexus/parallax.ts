import { trackNexusEvent } from './analytics';

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

const getDocumentProgress = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollableHeight <= 0) return 0;
  return clamp(window.scrollY / scrollableHeight);
};

const noop = () => undefined;

const setSectionDepth = (section: HTMLElement) => {
  const rect = section.getBoundingClientRect();
  const vh = window.innerHeight;
  const sectionHeight = rect.height;

  let entry = 0;
  let hold = 0;
  let exit = 0;

  if (rect.top > vh / 2) {
    entry = clamp((vh - rect.top) / (vh / 2));
  } else if (rect.bottom < vh / 2) {
    exit = clamp((vh / 2 - rect.bottom) / (vh / 2));
  } else {
    hold = 1;
  }

  let scale = 1.02;
  let lift = 0;
  let opacity = 1;
  let blur = 0;

  if (hold === 1) {
    scale = 1.02;
    lift = 0;
    opacity = 1;
    blur = 0;
  } else if (rect.top > vh / 2) {
    scale = 0.84 + entry * 0.18;
    lift = 60 - entry * 60;
    opacity = 0.35 + entry * 0.65;
    blur = 4 - entry * 4;
  } else {
    scale = 1.02 - exit * 0.16;
    lift = -exit * 60;
    opacity = 1 - exit * 0.6;
    blur = exit * 6;
  }

  const t = clamp((vh - rect.top) / (vh + sectionHeight));
  const ribbonShift = Math.round((t - 0.5) * 120);

  section.style.setProperty('--section-progress', t.toFixed(3));
  section.style.setProperty('--section-focus', hold.toFixed(3));
  section.style.setProperty('--section-lift', `${lift.toFixed(1)}px`);
  section.style.setProperty('--section-scale', scale.toFixed(3));
  section.style.setProperty('--section-opacity', opacity.toFixed(3));
  section.style.setProperty('--section-blur', `${blur.toFixed(1)}px`);
  section.style.setProperty('--section-ribbon-shift', `${ribbonShift}px`);

  section.classList.toggle('is-entering', rect.top > vh / 2 && entry < 0.98);
  section.classList.toggle('is-exiting', rect.bottom < vh / 2 && exit > 0.02);
};

const getSectionDetail = (section: HTMLElement) => ({
  section: section.id,
  label: section.dataset.sectionLabel ?? section.id,
  chapter: section.dataset.sectionChapter ?? '',
  stage: section.dataset.sectionStage ?? '',
  tone: section.dataset.sectionTone ?? '',
});

const parseMetricValue = (value: string) => {
  const match = value.trim().match(/^([^\d-]*)([\d,.]+)(.*)$/);
  if (!match) return null;

  const [, prefix, numberText, suffix] = match;
  const target = Number(numberText.replace(/,/g, ''));
  if (!Number.isFinite(target)) return null;

  return {
    prefix,
    suffix,
    target,
    decimals: numberText.includes('.') ? (numberText.split('.')[1]?.length ?? 0) : 0,
  };
};

const initProgressRail = (sections: HTMLElement[]) => {
  const root = document.querySelector<HTMLElement>('[data-exhibit-progress]');
  const progressBar = root?.querySelector<HTMLElement>('[data-progress-bar]');
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-progress-link]'));
  const labelTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-progress-current-label]'));
  const indexTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-progress-current-index]'));
  if (!root || !progressBar || links.length === 0) return noop;

  let frameId = 0;
  let activeSectionId = '';

  const update = () => {
    frameId = 0;
    const progress = getDocumentProgress();
    progressBar.style.transform = `scaleY(${progress.toFixed(3)})`;

    const activeSection = sections.reduce((current, section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.48 && rect.bottom >= window.innerHeight * 0.24) return section;
      return current;
    }, sections[0]);

    if (activeSection && activeSection.id !== activeSectionId) {
      const detail = getSectionDetail(activeSection);
      activeSectionId = activeSection.id;
      document.documentElement.dataset.nexusStage = activeSection.id;
      labelTargets.forEach((target) => {
        target.textContent = detail.label;
      });
      indexTargets.forEach((target) => {
        target.textContent = detail.chapter || '00';
      });
      window.dispatchEvent(new CustomEvent('nexus:stage_changed', { detail }));
    }

    links.forEach((link) => {
      const isActive = link.dataset.sectionTarget === activeSection?.id;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const requestUpdate = () => {
    if (frameId === 0) frameId = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

  return () => {
    if (frameId !== 0) window.cancelAnimationFrame(frameId);
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
  };
};

const initExhibitAtmosphere = (sections: HTMLElement[], prefersReducedMotion: boolean) => {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-atmosphere-canvas]');
  if (!canvas) return noop;

  const context = canvas.getContext('2d');
  if (!context) return noop;

  let frameId = 0;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let activeIndex = 0;
  let pointerX = 0.5;
  let pointerY = 0.5;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const updateActiveSection = () => {
    const nextIndex = sections.findIndex((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= window.innerHeight * 0.55 && rect.bottom >= window.innerHeight * 0.35;
    });

    if (nextIndex >= 0) activeIndex = nextIndex;
    document.documentElement.style.setProperty(
      '--nexus-atmosphere-shift',
      `${Math.round((getDocumentProgress() - 0.5) * 56)}px`
    );
  };

  const handlePointerMove = (event: PointerEvent) => {
    pointerX = clamp(event.clientX / Math.max(1, window.innerWidth));
    pointerY = clamp(event.clientY / Math.max(1, window.innerHeight));
    document.documentElement.style.setProperty('--nexus-pointer-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--nexus-pointer-y', `${event.clientY}px`);
  };

  const draw = (time: number) => {
    context.clearRect(0, 0, width, height);
    const palette = [
      ['45, 212, 191', '245, 158, 11'],
      ['20, 184, 166', '56, 189, 248'],
      ['56, 189, 248', '245, 158, 11'],
      ['244, 63, 94', '245, 158, 11'],
      ['45, 212, 191', '56, 189, 248'],
      ['16, 185, 129', '245, 158, 11'],
    ][activeIndex] ?? ['45, 212, 191', '245, 158, 11'];

    const bandCount = width < 720 ? 7 : 11;
    for (let bandIndex = 0; bandIndex < bandCount; bandIndex += 1) {
      const bandProgress = (bandIndex + 1) / (bandCount + 1);
      const drift = Math.sin(time * 0.00045 + bandIndex * 0.72 + activeIndex) * 34;
      const yPosition = height * bandProgress + drift + (pointerY - 0.5) * 34;
      const startX = -width * 0.16 + (pointerX - 0.5) * 42;
      const endX = width * 1.16;
      const gradient = context.createLinearGradient(startX, yPosition, endX, yPosition);
      gradient.addColorStop(0, `rgba(${palette[0]}, 0)`);
      gradient.addColorStop(0.42, `rgba(${palette[0]}, 0.22)`);
      gradient.addColorStop(0.7, `rgba(${palette[1]}, 0.14)`);
      gradient.addColorStop(1, `rgba(${palette[1]}, 0)`);

      context.strokeStyle = gradient;
      context.lineWidth = bandIndex % 3 === 0 ? 1.6 : 1;
      context.beginPath();
      context.moveTo(startX, yPosition);
      context.bezierCurveTo(width * 0.28, yPosition - 70, width * 0.72, yPosition + 70, endX, yPosition + drift * 0.22);
      context.stroke();
    }

    const packetCount = width < 720 ? 9 : 16;
    for (let packetIndex = 0; packetIndex < packetCount; packetIndex += 1) {
      const packetProgress = (time * (0.00008 + packetIndex * 0.000004) + packetIndex * 0.13) % 1;
      const xPosition = packetProgress * (width + 160) - 80;
      const yPosition = height * (((packetIndex * 37) % 100) / 100) + Math.sin(time * 0.0008 + packetIndex) * 20;
      context.fillStyle = packetIndex % 2 === 0 ? `rgba(${palette[0]}, 0.55)` : `rgba(${palette[1]}, 0.42)`;
      context.beginPath();
      context.roundRect(xPosition, yPosition, 24, 3, 999);
      context.fill();
    }

    if (!prefersReducedMotion) frameId = window.requestAnimationFrame(draw);
  };

  resize();
  updateActiveSection();
  draw(0);

  if (!prefersReducedMotion) frameId = window.requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', updateActiveSection, { passive: true });
  window.addEventListener('pointermove', handlePointerMove, { passive: true });

  return () => {
    if (frameId !== 0) window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', updateActiveSection);
    window.removeEventListener('pointermove', handlePointerMove);
  };
};

const initHeroMetricCountups = () => {
  const metrics = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-metric]'));
  if (metrics.length === 0) return noop;

  const runMetric = (metric: HTMLElement) => {
    if (metric.dataset.countupReady === 'true') return;
    const display = metric.querySelector<HTMLElement>('[data-countup-display]');
    const parsed = parseMetricValue(metric.dataset.countupValue ?? display?.textContent ?? '');
    if (!display || !parsed) return;

    metric.dataset.countupReady = 'true';
    const startedAt = performance.now();
    const duration = 1150;

    const render = (time: number) => {
      const progress = clamp((time - startedAt) / duration);
      const value = parsed.target * easeOutCubic(progress);
      display.textContent = `${parsed.prefix}${value.toFixed(parsed.decimals)}${parsed.suffix}`;
      if (progress < 1) window.requestAnimationFrame(render);
      else display.textContent = metric.dataset.countupValue ?? display.textContent;
    };

    display.textContent = `${parsed.prefix}${(0).toFixed(parsed.decimals)}${parsed.suffix}`;
    window.requestAnimationFrame(render);
  };

  if (!('IntersectionObserver' in window)) {
    metrics.forEach(runMetric);
    return noop;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runMetric(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  metrics.forEach((metric) => observer.observe(metric));
  return () => observer.disconnect();
};

const initHeroField = (prefersReducedMotion: boolean) => {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-field-canvas]');
  if (!canvas || prefersReducedMotion || canvas.dataset.heroFieldReady === 'true') return noop;

  const context = canvas.getContext('2d');
  if (!context) return noop;

  canvas.dataset.heroFieldReady = 'true';
  let frameId = 0;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const draw = (time: number) => {
    context.clearRect(0, 0, width, height);

    const gridSize = width < 720 ? 56 : 72;
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(148, 163, 184, 0.12)';

    for (let xPosition = (time * 0.006) % gridSize; xPosition < width; xPosition += gridSize) {
      context.beginPath();
      context.moveTo(xPosition, 0);
      context.lineTo(xPosition, height);
      context.stroke();
    }

    for (let yPosition = (time * 0.004) % gridSize; yPosition < height; yPosition += gridSize) {
      context.beginPath();
      context.moveTo(0, yPosition);
      context.lineTo(width, yPosition);
      context.stroke();
    }

    const streamCount = width < 720 ? 8 : 14;
    for (let index = 0; index < streamCount; index += 1) {
      const lane = (index + 1) / (streamCount + 1);
      const yPosition = height * lane + Math.sin(time * 0.001 + index) * 26;
      const progress = (time * (0.00011 + index * 0.000008) + index * 0.11) % 1;
      const xPosition = progress * (width + 220) - 110;
      const length = 120 + (index % 4) * 24;

      const gradient = context.createLinearGradient(xPosition - length, yPosition, xPosition, yPosition);
      gradient.addColorStop(0, 'rgba(45, 212, 191, 0)');
      gradient.addColorStop(0.48, index % 3 === 0 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(56, 189, 248, 0.42)');
      gradient.addColorStop(1, 'rgba(45, 212, 191, 0.82)');

      context.strokeStyle = gradient;
      context.lineWidth = index % 3 === 0 ? 2 : 1.4;
      context.beginPath();
      context.moveTo(xPosition - length, yPosition);
      context.lineTo(xPosition, yPosition);
      context.stroke();
    }

    frameId = window.requestAnimationFrame(draw);
  };

  resize();
  frameId = window.requestAnimationFrame(draw);
  window.addEventListener('resize', resize);

  return () => {
    if (frameId !== 0) window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
  };
};

const initBaselineSources = () => {
  const sourceGroups = Array.from(document.querySelectorAll<HTMLElement>('[data-baseline-sources]'));
  const cleanups: Array<() => void> = [];

  sourceGroups.forEach((group) => {
    if (group.dataset.sourcesReady === 'true') return;
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('[data-baseline-source]'));
    const section = group.closest<HTMLElement>('[data-nexus-section]');
    const bridge = section?.querySelector<HTMLElement>('[data-data-flow-bridge]');
    if (buttons.length === 0 || !bridge) return;

    group.dataset.sourcesReady = 'true';

    const selectSource = (button: HTMLButtonElement, shouldTrack = false, shouldDispatch = true) => {
      const sourceIndex = button.dataset.sourceIndex ?? '0';
      buttons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
      bridge.dataset.activeSource = sourceIndex;
      if (shouldDispatch) {
        window.dispatchEvent(
          new CustomEvent('nexus:baseline_source_selected', {
            detail: { source: button.dataset.sourceLabel ?? '', index: sourceIndex },
          })
        );
      }
      if (shouldTrack)
        trackNexusEvent('baseline_source_selected', { source: button.dataset.sourceLabel ?? sourceIndex });
    };

    buttons.forEach((button) => {
      const clickHandler = () => selectSource(button, true);
      const focusHandler = () => selectSource(button);
      const pointerHandler = () => {
        if (window.matchMedia('(hover: hover)').matches) selectSource(button);
      };

      button.addEventListener('click', clickHandler);
      button.addEventListener('focus', focusHandler);
      button.addEventListener('pointerenter', pointerHandler);
      cleanups.push(() => {
        button.removeEventListener('click', clickHandler);
        button.removeEventListener('focus', focusHandler);
        button.removeEventListener('pointerenter', pointerHandler);
      });
    });

    if (buttons[0]) selectSource(buttons[0], false, false);
  });

  return () => cleanups.forEach((cleanup) => cleanup());
};

export const initDataNexusParallax = async () => {
  if (document.documentElement.dataset.nexusParallaxReady === 'true') return;
  document.documentElement.dataset.nexusParallaxReady = 'true';

  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-nexus-section]'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cleanupProgressRail = initProgressRail(sections);
  const cleanupAtmosphere = initExhibitAtmosphere(sections, prefersReducedMotion);
  const cleanupCountups = initHeroMetricCountups();
  const cleanupHeroField = initHeroField(prefersReducedMotion);
  const cleanupBaselineSources = initBaselineSources();
  let cleanupFallback = noop;

  if (!prefersReducedMotion) {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    gsap.registerPlugin(ScrollTrigger);

    sections.forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: () => setSectionDepth(section),
      });
    });

    const timelineCursor = document.querySelector<HTMLElement>('[data-timeline-cursor]');
    const timelineSteps = Array.from(document.querySelectorAll<HTMLElement>('[data-timeline-step]'));
    const hero = document.querySelector<HTMLElement>('#overview');

    if (hero && timelineCursor && timelineSteps.length > 0) {
      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const progress = clamp(self.progress);
          const activeIndex = Math.min(timelineSteps.length - 1, Math.floor(progress * timelineSteps.length));
          timelineCursor.style.transform = `scaleY(${Math.max(0.08, progress).toFixed(3)})`;
          timelineSteps.forEach((step, index) => step.classList.toggle('is-active', index <= activeIndex));
        },
      });
    }

    document.querySelectorAll<HTMLElement>('[data-future-network]').forEach((network) => {
      const counters = Array.from(network.querySelectorAll<HTMLElement>('[data-future-counter]'));
      const updateFutureNetwork = (progress: number) => {
        const easedProgress = easeOutCubic(clamp(progress));
        network.style.setProperty('--future-progress', easedProgress.toFixed(3));

        counters.forEach((counter) => {
          const start = Number(counter.dataset.counterStart ?? '0');
          const target = Number(counter.dataset.counterTarget ?? '0');
          const suffix = counter.dataset.counterSuffix ?? '';
          if (!Number.isFinite(start) || !Number.isFinite(target)) return;
          const value = start + (target - start) * easedProgress;
          counter.textContent = `${Math.round(value)}${suffix}`;
        });
      };

      updateFutureNetwork(0);
      ScrollTrigger.create({
        trigger: network,
        start: 'top 78%',
        end: 'bottom 24%',
        scrub: true,
        onUpdate: (self) => updateFutureNetwork(self.progress),
      });
    });

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

    document.querySelectorAll<HTMLElement>('[data-evolution-slider]').forEach((slider) => {
      ScrollTrigger.create({
        trigger: slider,
        start: 'top 82%',
        end: 'bottom 24%',
        scrub: true,
        onUpdate: (self) => {
          slider.dispatchEvent(new CustomEvent('nexus:evolution-scroll', { detail: { progress: self.progress } }));
        },
      });
    });

    document.querySelectorAll<HTMLElement>('[data-nexus-section]').forEach((section) => {
      const stagedItems = section.querySelectorAll<HTMLElement>(
        'article, [data-baseline-source], [data-data-flow-bridge], [data-presentation-panel], [data-global-pulse], [data-tech-nodes], [data-dilemma-simulator]'
      );
      if (stagedItems.length === 0) return;

      gsap.fromTo(
        stagedItems,
        { autoAlpha: 0, y: 34 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: section,
            start: 'top 72%',
            once: true,
          },
        }
      );
    });
  } else {
    let fallbackRaf = 0;
    const updateFallback = () => {
      sections.forEach(setSectionDepth);
      fallbackRaf = 0;
    };
    const onScrollFallback = () => {
      if (!fallbackRaf) fallbackRaf = window.requestAnimationFrame(updateFallback);
    };
    window.addEventListener('scroll', onScrollFallback, { passive: true });
    updateFallback();

    // Assign to local cleanup function
    cleanupFallback = () => {
      window.removeEventListener('scroll', onScrollFallback);
      if (fallbackRaf) window.cancelAnimationFrame(fallbackRaf);
    };
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

  document.addEventListener(
    'astro:before-swap',
    () => {
      cleanupProgressRail();
      cleanupAtmosphere();
      cleanupCountups();
      cleanupHeroField();
      cleanupBaselineSources();
      observer.disconnect();
      cleanupFallback();
      delete document.documentElement.dataset.nexusParallaxReady;
    },
    { once: true }
  );
};
