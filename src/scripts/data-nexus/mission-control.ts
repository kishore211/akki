import { trackNexusEvent } from './analytics';

interface MissionVote {
  id: string;
  label: string;
  count: number;
}

const STORAGE_KEY = 'data-nexus-mission-votes';

const readVotes = (choices: HTMLButtonElement[]): MissionVote[] => {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    if (Array.isArray(stored) && stored.length === choices.length) {
      return stored.filter((item): item is MissionVote => {
        const vote = item as Partial<MissionVote>;
        return Boolean(vote.id && vote.label && typeof vote.count === 'number');
      });
    }
  } catch {
    // Session storage can be unavailable in private browsing modes.
  }

  return choices.map((choice) => ({
    id: choice.dataset.choiceId ?? '',
    label: choice.dataset.choiceLabel ?? '',
    count: Number(choice.dataset.seed ?? '0'),
  }));
};

const writeVotes = (votes: MissionVote[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  } catch {
    // Non-critical progressive enhancement.
  }
};

export const initMissionControl = () => {
  document.querySelectorAll<HTMLElement>('[data-mission-control]').forEach((root) => {
    if (root.dataset.missionReady === 'true') return;

    const startButton = root.querySelector<HTMLButtonElement>('[data-mission-start]');
    const status = root.querySelector<HTMLElement>('[data-mission-status]');
    const result = root.querySelector<HTMLElement>('[data-mission-result]');
    const voteTotal = root.querySelector<HTMLElement>('[data-vote-total]');
    const interactionCount = root.querySelector<HTMLElement>('[data-meter-interactions]');
    const interactionBar = root.querySelector<HTMLElement>('[data-meter-interactions-bar]');
    const presenterCue = root.querySelector<HTMLElement>('[data-presenter-cue]');
    const choices = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-mission-choice]'));

    root.dataset.missionReady = 'true';
    let interactions = 0;
    let votes = readVotes(choices);

    const bumpInteraction = () => {
      interactions += 1;
      if (interactionCount) interactionCount.textContent = String(interactions);
      if (interactionBar) interactionBar.style.width = `${Math.min(100, 12 + interactions * 12)}%`;
    };

    const renderVotes = (selectedId = '') => {
      const total = votes.reduce((sum, vote) => sum + vote.count, 0);
      if (voteTotal) voteTotal.textContent = `${total} votes`;

      choices.forEach((choice) => {
        const vote = votes.find((item) => item.id === choice.dataset.choiceId);
        const percent = total > 0 && vote ? Math.round((vote.count / total) * 100) : 0;
        const bar = choice.querySelector<HTMLElement>('[data-choice-bar]');
        const label = choice.querySelector<HTMLElement>('[data-choice-percent]');
        choice.classList.toggle('is-active', selectedId === choice.dataset.choiceId);
        choice.setAttribute('aria-pressed', String(selectedId === choice.dataset.choiceId));
        if (bar) bar.style.width = `${percent}%`;
        if (label) label.textContent = `${percent}%`;
      });
    };

    startButton?.addEventListener('click', () => {
      root.dataset.roomState = 'live';
      if (status) status.textContent = 'Room live';
      if (presenterCue)
        presenterCue.textContent = 'Send the room to the dilemma vote, then reveal the shared consequence.';
      bumpInteraction();
      trackNexusEvent('mission_room_opened');
    });

    choices.forEach((choice) => {
      choice.addEventListener('click', () => {
        const id = choice.dataset.choiceId ?? '';
        const label = choice.dataset.choiceLabel ?? 'Selected option';
        votes = votes.map((vote) => (vote.id === id ? { ...vote, count: vote.count + 1 } : vote));
        writeVotes(votes);
        renderVotes(id);
        if (result)
          result.textContent = `${label} is leading the room vote. Carry that answer back to the ethics simulator and explain the trade-off.`;
        if (presenterCue)
          presenterCue.textContent = `Audience selected: ${label}. Connect the vote to privacy, intervention speed, and governance.`;
        bumpInteraction();
        trackNexusEvent('mission_vote', { choice: id });
      });
    });

    window.addEventListener('nexus:globe_region_selected', (event) => {
      const region = (event as CustomEvent<{ region?: string }>).detail?.region ?? 'a region';
      if (presenterCue)
        presenterCue.textContent = `Global pulse selected ${region}. Tie geography to privacy pressure before moving forward.`;
      bumpInteraction();
    });

    window.addEventListener('nexus:evolution_slider_changed', () => {
      if (presenterCue)
        presenterCue.textContent =
          'The infrastructure slider moved. Ask what changed: energy, latency, or privacy risk?';
      bumpInteraction();
    });

    window.addEventListener('nexus:dilemma_choice', (event) => {
      const choice = (event as CustomEvent<{ choice?: string }>).detail?.choice ?? '';
      if (choice) renderVotes(choice);
      bumpInteraction();
    });

    renderVotes();
  });
};
