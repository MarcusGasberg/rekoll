import Dexie, { type EntityTable } from 'dexie';
import type { BrowsingEvent, EmbeddingRecord } from '@/shared/types';

const db = new Dexie('BrowsingContextDB') as Dexie & {
  browsing_events: EntityTable<BrowsingEvent, 'id'>;
  embeddings: EntityTable<EmbeddingRecord, 'id'>;
};

db.version(1).stores({
  browsing_events: '++id, url, domain, timestamp, eventType, embeddingId',
  embeddings: '++id, eventId, modelVersion',
});

export { db };
