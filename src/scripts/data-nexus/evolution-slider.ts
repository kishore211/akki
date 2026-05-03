import { trackNexusEvent } from './analytics';

interface EvolutionScrollDetail {
  progress?: number;
  value?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatMetric = (value: number, unit: string) => {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString()}${unit}`;
};

export const initEvolutionSliders = () => {
  document.querySelectorAll<HTMLElement>('[data-evolution-slider]').forEach((root) => {
    if (root.dataset.evolutionReady === 'true') return;

    const input = root.querySelector<HTMLInputElement>('[data-evolution-slider-input]');
    const readout = root.querySelector<HTMLElement>('[data-evolution-readout]');
    const metrics = Array.from(root.querySelectorAll<HTMLElement>('[data-lab-metric]'));
    const hotspots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hotspot]'));
    const hotspotTitle = root.querySelector<HTMLElement>('[data-hotspot-title]');
    const hotspotBody = root.querySelector<HTMLElement>('[data-hotspot-body]');
    if (!input) return;

    root.dataset.evolutionReady = 'true';
    let completionTracked = false;
    let activeHotspot = '';

    const updateHotspot = (value: number, forceButton?: HTMLButtonElement) => {
      const selected =
        forceButton ??
        hotspots.reduce<HTMLButtonElement | null>((closest, hotspot) => {
          const trigger = Number(hotspot.dataset.trigger ?? '0');
          if (!closest) return hotspot;
          const currentDistance = Math.abs(trigger - value);
          const closestDistance = Math.abs(Number(closest.dataset.trigger ?? '0') - value);
          return currentDistance < closestDistance ? hotspot : closest;
        }, null);

      if (!selected) return;
      const label = selected.dataset.hotspotLabel ?? '';
      const body = selected.dataset.hotspotBody ?? '';
      hotspots.forEach((hotspot) => hotspot.classList.toggle('is-active', hotspot === selected));
      if (hotspotTitle) hotspotTitle.textContent = label;
      if (hotspotBody) hotspotBody.textContent = body;

      if (label && label !== activeHotspot) {
        activeHotspot = label;
        trackNexusEvent('evolution_hotspot_viewed', { hotspot: label });
      }
    };

    const update = (source: 'manual' | 'scroll' | 'hotspot' = 'manual') => {
      const value = clamp(Number(input.value), 0, 100);
      const progress = value / 100;
      root.style.setProperty('--position', `${value}%`);
      root.style.setProperty('--lab-progress', String(progress));
      if (readout) readout.textContent = `${Math.round(value)}%`;

      metrics.forEach((metric) => {
        const start = Number(metric.dataset.start ?? '0');
        const end = Number(metric.dataset.end ?? '0');
        const unit = metric.dataset.unit ?? '';
        const output = metric.querySelector<HTMLElement>('[data-lab-metric-value]');
        if (output) output.textContent = formatMetric(start + (end - start) * progress, unit);
      });

      updateHotspot(value);

      if (!completionTracked && (value <= 8 || value >= 92)) {
        completionTracked = true;
        trackNexusEvent('evolution_slider_completed', { value });
      }

      if (source !== 'scroll') root.dataset.userControlled = 'true';
    };

    input.addEventListener('input', () => update('manual'));
    input.addEventListener('change', () => {
      trackNexusEvent('evolution_slider_changed', { value: Number(input.value) });
    });

    hotspots.forEach((hotspot) => {
      const inspect = () => {
        input.value = hotspot.dataset.trigger ?? input.value;
        updateHotspot(Number(input.value), hotspot);
        update('hotspot');
      };
      hotspot.addEventListener('click', inspect);
      hotspot.addEventListener('focus', inspect);
    });

    root.addEventListener('nexus:evolution-scroll', (event) => {
      const detail = (event as CustomEvent<EvolutionScrollDetail>).detail ?? {};
      const value =
        typeof detail.value === 'number' ? detail.value : 10 + clamp(Number(detail.progress ?? 0), 0, 1) * 84;
      input.value = String(Math.round(value));
      update('scroll');
    });

    update('scroll');
  });
};
