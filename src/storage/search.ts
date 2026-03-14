import { db } from './db';
import { cosineSimilarity, topK } from '@/shared/vector-math';
import type { SearchResult } from '@/shared/messages';

export interface SearchFilters {
  domain?: string;
  eventType?: string;
  startDate?: number;
  endDate?: number;
}

export async function semanticSearch(
  queryVector: Float32Array,
  limit = 10,
  filters?: SearchFilters,
): Promise<SearchResult[]> {
  // Get all embeddings
  const embeddings = await db.embeddings.toArray();
  if (embeddings.length === 0) return [];

  // Compute similarities
  const scores = embeddings.map((emb) => ({
    eventId: emb.eventId,
    score: cosineSimilarity(queryVector, emb.vector),
  }));

  // Get top candidates (fetch more than needed to allow for filtering)
  const candidates = topK(
    scores.map((s) => s.score),
    Math.min(limit * 3, scores.length),
  );

  // Fetch events for candidates
  const eventIds = candidates.map((c) => scores[c.index].eventId);
  const events = await db.browsing_events.bulkGet(eventIds);

  // Apply filters and build results, deduplicating by eventId
  const results: SearchResult[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < candidates.length && results.length < limit; i++) {
    const event = events[i];
    if (!event) continue;
    if (event.id != null && seen.has(event.id)) continue;

    if (filters?.domain && event.domain !== filters.domain) continue;
    if (filters?.eventType && event.eventType !== filters.eventType) continue;
    if (filters?.startDate && event.timestamp < filters.startDate) continue;
    if (filters?.endDate && event.timestamp > filters.endDate) continue;

    if (event.id != null) seen.add(event.id);
    results.push({ event, score: candidates[i].score });
  }

  return results;
}
