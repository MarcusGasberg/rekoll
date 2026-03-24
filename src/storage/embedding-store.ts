import { db } from './db';
import type { EmbeddingRecord } from '@/shared/types';

export async function addEmbedding(
  eventId: number,
  vector: Float32Array,
  modelVersion: string,
): Promise<number> {
  const id = (await db.embeddings.add({
    eventId,
    sourceType: 'event',
    vector,
    modelVersion,
  } as EmbeddingRecord)) as number;

  // Link embedding back to the event
  await db.browsing_events.update(eventId, { embeddingId: id });

  return id;
}

export async function addSessionEmbedding(
  sessionId: number,
  vector: Float32Array,
  modelVersion: string,
): Promise<number> {
  const id = (await db.embeddings.add({
    sessionId,
    sourceType: 'session',
    vector,
    modelVersion,
  } as EmbeddingRecord)) as number;

  await db.sessions.update(sessionId, { embeddingId: id });

  return id;
}

export async function updateEmbeddingVector(
  embeddingId: number,
  vector: Float32Array,
): Promise<void> {
  await db.embeddings.update(embeddingId, { vector });
}

export async function getAllEmbeddings(): Promise<EmbeddingRecord[]> {
  return db.embeddings.toArray();
}

export async function getEmbeddingByEventId(
  eventId: number,
): Promise<EmbeddingRecord | undefined> {
  return db.embeddings.where('eventId').equals(eventId).first();
}

export async function getUnembeddedEventIds(): Promise<number[]> {
  const events = await db.browsing_events
    .filter((e) => e.embeddingId == null)
    .toArray();
  return events.map((e) => e.id!);
}

export async function getUnembeddedSessionIds(): Promise<number[]> {
  const sessions = await db.sessions
    .filter((s) => s.embeddingId == null)
    .toArray();
  return sessions.map((s) => s.id!);
}

/** Find event IDs whose embeddings use an outdated model version. */
export async function getStaleEmbeddingEventIds(currentVersion: string): Promise<number[]> {
  const stale = await db.embeddings
    .filter((e) => e.sourceType === 'event' && e.modelVersion !== currentVersion)
    .toArray();
  return stale.filter((e) => e.eventId != null).map((e) => e.eventId!);
}
