import { db } from './db';
import type { BrowsingEvent } from '@/shared/types';

export async function addEvent(
  event: Omit<BrowsingEvent, 'id' | 'embeddingId'>,
  sessionId?: number | null,
): Promise<number> {
  // Session-scoped dedup: skip page_visit if same URL already captured in this session
  if (event.eventType === 'page_visit' && sessionId != null) {
    const existing = await db.browsing_events
      .where('url')
      .equals(event.url)
      .and((e) => e.sessionId === sessionId && e.eventType === 'page_visit')
      .first();

    if (existing?.id != null) return existing.id;
  }

  // Fallback dedup: skip if same URL visited within last 30 seconds
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
  await db.sessions.clear();
}
