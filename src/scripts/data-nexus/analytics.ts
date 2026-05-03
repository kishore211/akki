type NexusEventPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export const trackNexusEvent = (eventName: string, payload: NexusEventPayload = {}) => {
  const detail = {
    source: 'data-nexus',
    ...payload,
  };

  window.dispatchEvent(new CustomEvent(`nexus:${eventName}`, { detail }));

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...detail });
  }
};
