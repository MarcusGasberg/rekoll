import { db } from './db';
import { cosineSimilarity, topK } from '@/shared/vector-math';
import type { SearchResult } from '@/shared/messages';
import type { BrowsingEvent } from '@/shared/types';

export interface SearchFilters {
  domain?: string;
  eventType?: string;
  startDate?: number;
  endDate?: number;
}

// ── Keyword scoring ──

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_/.,;:!?'"()\[\]{}]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function keywordScore(queryTerms: string[], event: BrowsingEvent): number {
  if (queryTerms.length === 0) return 0;

  const titleLower = (event.title ?? '').toLowerCase();
  const domainLower = (event.domain ?? '').toLowerCase();
  const urlLower = (event.url ?? '').toLowerCase();
  const textLower = (event.textContent ?? '').toLowerCase();

  let score = 0;
  for (const term of queryTerms) {
    if (titleLower.includes(term)) score += 3;
    if (domainLower.includes(term)) score += 2;
    if (urlLower.includes(term)) score += 1.5;
    if (textLower.includes(term)) score += 1;
  }

  // Normalize by max possible score per term (3 + 2 + 1.5 + 1 = 7.5)
  return score / (queryTerms.length * 7.5);
}

// ── Semantic alpha selection ──

const QUESTION_WORDS = new Set(['how', 'what', 'where', 'why', 'when', 'which', 'who']);

function getSemanticAlpha(query: string): number {
  const words = query.toLowerCase().split(/\s+/);
  const wordCount = words.length;

  // Natural language / question query → favor semantic
  if (wordCount > 5 || query.includes('?') || QUESTION_WORDS.has(words[0])) {
    return 0.75;
  }
  // Short query → favor keyword
  if (wordCount <= 2) {
    return 0.4;
  }
  // Default
  return 0.6;
}

// ── Recency boost ──

function recencyBoost(timestamp: number): number {
  const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  return 1 + 0.15 * Math.exp(-ageInDays / 14);
}

// ── Diversity re-ranking ──

interface ScoredResult extends SearchResult {
  _adjustedScore?: number;
}

function diversityRerank(results: ScoredResult[], limit: number): ScoredResult[] {
  if (results.length <= 1) return results.slice(0, limit);

  const pool = results.slice(0, limit * 3);
  const selected: ScoredResult[] = [];
  const domainCounts = new Map<string, number>();
  const sessionCounts = new Map<number, number>();

  while (selected.length < limit && pool.length > 0) {
    let bestIdx = 0;
    let bestScore = -1;

    for (let i = 0; i < pool.length; i++) {
      const r = pool[i];
      let penalty = 1;

      const domainCount = domainCounts.get(r.event.domain) ?? 0;
      penalty *= Math.pow(0.85, domainCount);

      if (r.sessionId != null) {
        const sessionCount = sessionCounts.get(r.sessionId) ?? 0;
        penalty *= Math.pow(0.80, sessionCount);
      }

      // Floor penalty at 0.5
      penalty = Math.max(penalty, 0.5);

      const adjusted = r.score * penalty;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIdx = i;
      }
    }

    const pick = pool.splice(bestIdx, 1)[0];
    domainCounts.set(pick.event.domain, (domainCounts.get(pick.event.domain) ?? 0) + 1);
    if (pick.sessionId != null) {
      sessionCounts.set(pick.sessionId, (sessionCounts.get(pick.sessionId) ?? 0) + 1);
    }
    selected.push(pick);
  }

  return selected;
}

// ── Pre-filtering ──

async function getFilteredEventIds(filters: SearchFilters): Promise<Set<number> | null> {
  // No filters → don't restrict
  if (!filters.domain && !filters.eventType && !filters.startDate && !filters.endDate) {
    return null;
  }

  let collection = db.browsing_events.toCollection();

  // Apply Dexie where clauses where possible
  if (filters.domain) {
    collection = db.browsing_events.where('domain').equals(filters.domain);
  }

  const events = await collection.toArray();
  const ids = new Set<number>();

  for (const e of events) {
    if (!e.id) continue;
    if (filters.eventType && e.eventType !== filters.eventType) continue;
    if (filters.startDate && e.timestamp < filters.startDate) continue;
    if (filters.endDate && e.timestamp > filters.endDate) continue;
    // domain already handled by where clause if set, but check for non-indexed path
    if (filters.domain && e.domain !== filters.domain) continue;
    ids.add(e.id);
  }

  return ids;
}

// ── Main hybrid search ──

export async function hybridSearch(
  queryVector: Float32Array,
  query: string,
  limit = 10,
  filters?: SearchFilters,
): Promise<SearchResult[]> {
  // Pre-filter: get allowed event IDs if filters present
  const allowedIds = filters ? await getFilteredEventIds(filters) : null;

  const embeddings = await db.embeddings.toArray();
  if (embeddings.length === 0) return [];

  const alpha = getSemanticAlpha(query);
  const queryTerms = tokenize(query);

  // Score all embeddings for semantic similarity
  const semanticScores = new Map<number, number>(); // embeddingIndex -> score
  for (let i = 0; i < embeddings.length; i++) {
    semanticScores.set(i, cosineSimilarity(queryVector, embeddings[i].vector));
  }

  // Build event result map from embeddings
  // Maps eventId -> { semanticScore, sessionId?, sessionNarrative? }
  const resultMap = new Map<number, {
    semanticScore: number;
    sessionId?: number;
    sessionNarrative?: string;
    fromSession: boolean;
  }>();

  // Get top semantic candidates (generous over-fetch)
  const topCandidates = topK(
    embeddings.map((_, i) => semanticScores.get(i)!),
    Math.min(limit * 10, embeddings.length),
  );

  for (const candidate of topCandidates) {
    const emb = embeddings[candidate.index];
    const score = candidate.score;

    if (emb.sourceType === 'session' && emb.sessionId != null) {
      // Session match: discount score for constituent events
      const session = await db.sessions.get(emb.sessionId);
      if (!session) continue;

      const discountedScore = score * 0.4;

      for (const eventId of session.eventIds) {
        // Skip if filtered out
        if (allowedIds && !allowedIds.has(eventId)) continue;

        const existing = resultMap.get(eventId);
        if (existing) {
          // Boost existing score with session contribution
          existing.semanticScore = Math.max(
            existing.semanticScore,
            existing.semanticScore + discountedScore * 0.3,
          );
          existing.sessionId = existing.sessionId ?? session.id;
          existing.sessionNarrative = existing.sessionNarrative ?? session.narrative;
        } else {
          resultMap.set(eventId, {
            semanticScore: discountedScore,
            sessionId: session.id,
            sessionNarrative: session.narrative,
            fromSession: true,
          });
        }
      }
    } else if (emb.eventId != null) {
      // Skip if filtered out
      if (allowedIds && !allowedIds.has(emb.eventId)) continue;

      const existing = resultMap.get(emb.eventId);
      if (!existing || score > existing.semanticScore) {
        resultMap.set(emb.eventId, {
          semanticScore: score,
          sessionId: existing?.sessionId,
          sessionNarrative: existing?.sessionNarrative,
          fromSession: false,
        });
      }
    }
  }

  // Fetch all candidate events
  const eventIds = [...resultMap.keys()];
  const events = await db.browsing_events.bulkGet(eventIds);

  // Compute hybrid scores
  const results: ScoredResult[] = [];
  for (let i = 0; i < eventIds.length; i++) {
    const event = events[i];
    if (!event) continue;

    const meta = resultMap.get(eventIds[i])!;
    const kScore = keywordScore(queryTerms, event);
    const hybridScore = alpha * meta.semanticScore + (1 - alpha) * kScore;
    const finalScore = hybridScore * recencyBoost(event.timestamp);

    const hasSemantic = meta.semanticScore > 0.3;
    const hasKeyword = kScore > 0;
    const matchType: 'semantic' | 'keyword' | 'both' =
      hasSemantic && hasKeyword ? 'both' : hasKeyword ? 'keyword' : 'semantic';

    results.push({
      event,
      score: finalScore,
      matchType,
      sessionId: meta.sessionId,
      sessionNarrative: meta.sessionNarrative,
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Apply diversity re-ranking
  return diversityRerank(results, limit);
}

// Keep backward-compatible export (deprecated)
export async function semanticSearch(
  queryVector: Float32Array,
  limit = 10,
  filters?: SearchFilters,
): Promise<SearchResult[]> {
  return hybridSearch(queryVector, '', limit, filters);
}
