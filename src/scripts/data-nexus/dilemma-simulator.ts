import { trackNexusEvent } from './analytics';

const parseImpact = (value: string | null): string[] => {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const initDilemmaSimulators = () => {
  document.querySelectorAll<HTMLElement>('[data-dilemma-simulator]').forEach((root) => {
    if (root.dataset.dilemmaReady === 'true') return;

    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dilemma-choice]'));
    const title = root.querySelector<HTMLElement>('[data-dilemma-result-title]');
    const body = root.querySelector<HTMLElement>('[data-dilemma-result-body]');
    const impactList = root.querySelector<HTMLUListElement>('[data-dilemma-impact]');
    const reset = root.querySelector<HTMLButtonElement>('[data-dilemma-reset]');

    if (!title || !body || !impactList || !reset) return;

    root.dataset.dilemmaReady = 'true';

    const resetState = () => {
      buttons.forEach((button) => {
        button.classList.remove('is-active');
        button.setAttribute('aria-pressed', 'false');
      });
      title.textContent = 'Choose a path to reveal the fallout.';
      body.textContent =
        "The simulator keeps the PRD's moral question in the interface instead of leaving it as a paragraph in the report.";
      impactList.replaceChildren();
      root.dataset.consequenceReady = 'false';
      reset.classList.add('hidden');
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((item) => {
          const isActive = item === button;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-pressed', String(isActive));
        });

        title.textContent = button.dataset.outcomeTitle ?? '';
        body.textContent = button.dataset.outcome ?? '';
        impactList.replaceChildren();

        root.dataset.consequenceReady = 'false';
        parseImpact(button.dataset.impact ?? null).forEach((impact, index) => {
          const item = document.createElement('li');
          item.className =
            'consequence-card rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200';
          item.style.setProperty('--impact-index', String(index));

          const label = document.createElement('span');
          label.className = 'mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-rose-500 dark:text-rose-200';
          label.textContent = `Consequence 0${index + 1}`;

          const text = document.createElement('span');
          text.textContent = impact;

          item.append(label, text);
          impactList.append(item);
        });

        window.requestAnimationFrame(() => {
          root.dataset.consequenceReady = 'true';
        });

        reset.classList.remove('hidden');
        const choice = button.dataset.dilemmaChoice ?? 'unknown';
        window.dispatchEvent(new CustomEvent('nexus:dilemma_choice', { detail: { choice } }));
        trackNexusEvent('dilemma_choice', { choice });
      });
    });

    reset.addEventListener('click', () => {
      resetState();
      trackNexusEvent('dilemma_reset');
    });
  });
};
