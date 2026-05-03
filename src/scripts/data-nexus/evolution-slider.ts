import { trackNexusEvent } from './analytics';

export const initEvolutionSliders = () => {
  document.querySelectorAll<HTMLElement>('[data-evolution-slider]').forEach((root) => {
    if (root.dataset.evolutionReady === 'true') return;

    const input = root.querySelector<HTMLInputElement>('[data-evolution-slider-input]');
    if (!input) return;

    root.dataset.evolutionReady = 'true';
    let completionTracked = false;

    const update = () => {
      const value = Number(input.value);
      root.style.setProperty('--position', `${value}%`);

      if (!completionTracked && (value <= 8 || value >= 92)) {
        completionTracked = true;
        trackNexusEvent('evolution_slider_completed', { value });
      }
    };

    input.addEventListener('input', update);
    input.addEventListener('change', () => {
      trackNexusEvent('evolution_slider_changed', { value: Number(input.value) });
    });

    update();
  });
};
