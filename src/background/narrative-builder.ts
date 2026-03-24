import type { BrowsingEvent } from '@/shared/types';

const MAX_NARRATIVE_LENGTH = 2000;

function sentenceForEvent(event: BrowsingEvent, isFirst: boolean): string {
  const { title, domain, eventType, metadata } = event;

  switch (eventType) {
    case 'video_watch': {
      const channel = metadata?.channel ? ` by ${metadata.channel}` : '';
      return `Watched a video "${title}"${channel} on ${domain}.`;
    }
    case 'like': {
      const target = metadata?.target ?? title;
      return `Liked "${target}" on ${domain}.`;
    }
    case 'purchase': {
      const product = metadata?.product ?? title;
      const price = metadata?.price ? ` for ${metadata.price}` : '';
      return `Purchased "${product}"${price} on ${domain}.`;
    }
    case 'page_visit':
    default: {
      if (isFirst) {
        return `Started by visiting "${title}" on ${domain}.`;
      }
      return `Then visited "${title}" on ${domain}.`;
    }
  }
}

export function buildNarrative(events: BrowsingEvent[]): string {
  if (events.length === 0) return '';

  const sentences = events.map((e, i) => sentenceForEvent(e, i === 0));
  const full = sentences.join(' ');

  if (full.length <= MAX_NARRATIVE_LENGTH) return full;

  // Keep first 3 and last 3 sentences with ellipsis
  const head = sentences.slice(0, 3);
  const tail = sentences.slice(-3);
  return [...head, '...', ...tail].join(' ');
}
