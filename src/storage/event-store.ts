import { db } from './db';
import type { BrowsingEvent } from '@/shared/types';

export async function addEvent(
  event: Omit<BrowsingEvent, 'id' | 'embeddingId'>,
): Promise<number> {
  // Deduplicate: skip if same URL visited within last 30 seconds
  const recent = await db.browsing_events
    .where('url')
    .equals(event.url)
    .and((e) => e.timestamp > Date.now() - 30_000 && e.eventType === event.eventType)
    .first();

  if (recent?.id != null) return recent.id;

  const id = await db.browsing_events.add(event as BrowsingEvent);
  return id!;
}

export async function getRecentEvents(
  limit = 50,
  offset = 0,
): Promise<BrowsingEvent[]> {
  return db.browsing_events
    .orderBy('timestamp')
    .reverse()
    .offset(offset)
    .limit(limit)
    .toArray();
}

export async function getEventCount(): Promise<number> {
  return db.browsing_events.count();
}

export async function clearAllEvents(): Promise<void> {
  await db.browsing_events.clear();
  await db.embeddings.clear();
}
