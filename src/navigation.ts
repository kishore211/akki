import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Intro', href: getPermalink('/#overview') },
    { text: '2025', href: getPermalink('/#baseline') },
    { text: '2035', href: getPermalink('/#future') },
    { text: 'Ethics', href: getPermalink('/#ethics') },
    { text: 'Crypto', href: getPermalink('/#crypto') },
    { text: 'Showcase', href: getPermalink('/#showcase') },
  ],
  actions: [{ text: 'Dilemma', href: getPermalink('/#dilemma'), icon: 'tabler:message-question' }],
};

export const footerData = {
  links: [
    {
      title: 'Exhibit',
      links: [
        { text: 'Global Data Pulse', href: getPermalink('/#baseline') },
        { text: 'Evolution Slider', href: getPermalink('/#future') },
        { text: 'Dilemma Simulator', href: getPermalink('/#dilemma') },
      ],
    },
    {
      title: 'Research Themes',
      links: [
        { text: 'Lakehouse architecture', href: getPermalink('/#baseline') },
        { text: 'Quantum energy pressure', href: getPermalink('/#future') },
        { text: 'Cognitive privacy', href: getPermalink('/#ethics') },
      ],
    },
    {
      title: 'Solutions',
      links: [
        { text: 'Federated learning', href: getPermalink('/#crypto') },
        { text: 'Homomorphic encryption', href: getPermalink('/#crypto') },
        { text: 'Zero-knowledge proofs', href: getPermalink('/#crypto') },
      ],
    },
    {
      title: 'Capstone',
      links: [
        { text: 'Presentation plan', href: getPermalink('/#showcase') },
        { text: 'Success metrics', href: getPermalink('/#showcase') },
        { text: 'Works cited', href: getPermalink('/#showcase') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Academic showcase prototype', href: getPermalink('/#overview') },
    { text: 'Static Vercel deployment', href: getPermalink('/#showcase') },
  ],
  socialLinks: [
    { ariaLabel: 'Overview', icon: 'tabler:timeline', href: getPermalink('/#overview') },
    { ariaLabel: 'Ethics section', icon: 'tabler:scale', href: getPermalink('/#ethics') },
    { ariaLabel: 'Cryptography section', icon: 'tabler:lock', href: getPermalink('/#crypto') },
  ],
  footNote: 'Built for The Data Nexus: Journey to 2035 capstone showcase.',
};
