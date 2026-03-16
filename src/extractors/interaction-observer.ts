import type { EventType } from '@/shared/types';
import type { InteractionSpec } from './types';

export interface InteractionEvent {
  eventType: EventType;
  metadata: Record<string, unknown>;
  label?: string;
}

export function startInteractionObserver(
  specs: InteractionSpec[],
  onInteraction: (result: InteractionEvent) => void,
): () => void {
  const debounceMap = new Map<string, number>();
  const DEBOUNCE_MS = 2000;

  function handler(event: Event) {
    let target = event.target as Element | null;

    while (target && target !== document.body) {
      for (const spec of specs) {
        try {
          if (!target.matches(spec.selector)) continue;
        } catch {
          continue; // invalid selector
        }

        // Debounce: suppress same selector within 2s
        const now = Date.now();
        const lastFired = debounceMap.get(spec.selector) ?? 0;
        if (now - lastFired < DEBOUNCE_MS) return;

        const metadata = spec.extractMetadata(target, document);
        if (!metadata) return;

        debounceMap.set(spec.selector, now);
        onInteraction({
          eventType: spec.eventType,
          metadata,
          label: spec.label,
        });
        return; // first match wins
      }
      target = target.parentElement;
    }
  }

  document.body.addEventListener('click', handler, true);
  return () => document.body.removeEventListener('click', handler, true);
}
