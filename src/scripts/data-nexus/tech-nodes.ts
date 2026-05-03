import { trackNexusEvent } from './analytics';

interface ProtocolPayload {
  id: string;
  name: string;
  shortName: string;
  promise: string;
  mechanism: string;
  riskSolved: string;
  flow: string[];
}

const parseProtocol = (value: string | null): ProtocolPayload | null => {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;

    const candidate = parsed as Partial<ProtocolPayload>;
    if (!candidate.id || !candidate.name || !Array.isArray(candidate.flow)) return null;

    return {
      id: candidate.id,
      name: candidate.name,
      shortName: candidate.shortName ?? '',
      promise: candidate.promise ?? '',
      mechanism: candidate.mechanism ?? '',
      riskSolved: candidate.riskSolved ?? '',
      flow: candidate.flow.filter((item): item is string => typeof item === 'string'),
    };
  } catch {
    return null;
  }
};

export const initTechNodes = () => {
  document.querySelectorAll<HTMLElement>('[data-tech-nodes]').forEach((root) => {
    if (root.dataset.techNodesReady === 'true') return;

    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tech-node]'));
    const title = root.querySelector<HTMLElement>('[data-tech-title]');
    const kicker = root.querySelector<HTMLElement>('[data-tech-kicker]');
    const mechanism = root.querySelector<HTMLElement>('[data-tech-mechanism]');
    const risk = root.querySelector<HTMLElement>('[data-tech-risk]');
    const flow = root.querySelector<HTMLElement>('[data-tech-flow]');

    if (!title || !kicker || !mechanism || !risk || !flow) return;

    root.dataset.techNodesReady = 'true';

    const renderProtocol = (button: HTMLButtonElement, shouldBroadcast = true) => {
      const protocol = parseProtocol(button.dataset.protocol ?? null);
      if (!protocol) return;

      buttons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
        item.tabIndex = isActive ? 0 : -1;
      });

      kicker.textContent = protocol.shortName ? `${protocol.shortName} protocol node` : 'Protocol node';
      title.textContent = protocol.name;
      mechanism.textContent = protocol.mechanism;
      risk.textContent = protocol.riskSolved;

      flow.replaceChildren();
      protocol.flow.forEach((step, index) => {
        const item = document.createElement('div');
        item.className =
          'flow-step rounded-2xl border border-white/10 bg-white/6 p-4 text-center text-sm font-semibold text-white';
        item.dataset.flowStep = '';
        item.style.setProperty('--flow-index', String(index));
        item.textContent = step;
        flow.append(item);
        window.setTimeout(() => item.classList.add('is-animating'), index * 120);
      });

      if (shouldBroadcast) {
        window.dispatchEvent(new CustomEvent('nexus:tech_node_selected', { detail: { protocol: protocol.id } }));
        trackNexusEvent('tech_node_selected', { protocol: protocol.id });
      }
    };

    const selectButton = (button: HTMLButtonElement) => {
      renderProtocol(button);
      button.focus();
    };

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => renderProtocol(button));
      button.addEventListener('keydown', (event) => {
        if (
          event.key !== 'ArrowRight' &&
          event.key !== 'ArrowDown' &&
          event.key !== 'ArrowLeft' &&
          event.key !== 'ArrowUp'
        ) {
          return;
        }

        event.preventDefault();
        const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = (index + direction + buttons.length) % buttons.length;
        selectButton(buttons[nextIndex]);
      });
    });
    if (buttons[0]) renderProtocol(buttons[0], false);
  });
};
