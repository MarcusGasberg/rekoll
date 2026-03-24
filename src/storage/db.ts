import Dexie, { type EntityTable } from 'dexie';
import type { BrowsingEvent, EmbeddingRecord, Session } from '@/shared/types';

const db = new Dexie('BrowsingContextDB') as Dexie & {
  browsing_events: EntityTable<BrowsingEvent, 'id'>;
  embeddings: EntityTable<EmbeddingRecord, 'id'>;
  sessions: EntityTable<Session, 'id'>;
};

db.version(1).stores({
  browsing_events: '++id, url, domain, timestamp, eventType, embeddingId',
  embeddings: '++id, eventId, modelVersion',
});

db.version(2).stores({
  browsing_events: '++id, url, domain, timestamp, eventType, embeddingId, sessionId',
  embeddings: '++id, eventId, sessionId, sourceType, modelVersion',
  sessions: '++id, startTime, endTime, embeddingId',
}).upgrade(tx => {
  return tx.table('embeddings').toCollection().modify(emb => {
    emb.sourceType = 'event';
  });
});

export { db };
