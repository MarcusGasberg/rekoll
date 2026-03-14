import { db } from './db';
import type { EmbeddingRecord } from '@/shared/types';

export async function addEmbedding(
  eventId: number,
  vector: Float32Array,
  modelVersion: string,
): Promise<number> {
  const id = (await db.embeddings.add({
    eventId,
    vector,
    modelVersion,
  } as EmbeddingRecord)) as number;

  // Link embedding back to the event
  await db.browsing_events.update(eventId, { embeddingId: id });

  return id;
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
