import { db } from '@/storage/db';
import {
  addEmbedding,
  addSessionEmbedding,
  updateEmbeddingVector,
  getUnembeddedEventIds,
  getUnembeddedSessionIds,
  getStaleEmbeddingEventIds,
  getEmbeddingByEventId,
} from '@/storage/embedding-store';
import { sendToOffscreen } from './offscreen-manager';
import type {
  EmbedTextResponse,
  EmbedTextError,
} from '@/shared/messages';
import type { BrowsingEvent, Session } from '@/shared/types';

const MODEL_VERSION = 'all-MiniLM-L6-v2-q8-v2';

/** Build enriched text for embedding that includes event type context. */
function buildEmbeddingText(event: BrowsingEvent): string {
  const meta = event.metadata ?? {};
  const text = event.textContent ?? '';

  switch (event.eventType) {
    case 'video_watch': {
      const channel = meta.channel ? ` by ${meta.channel}` : '';
      return `Watched video: ${event.title}${channel} on ${event.domain}. ${text}`;
    }
    case 'purchase': {
      const price = meta.price ? ` for ${meta.price}` : '';
      return `Purchased: ${event.title}${price} on ${event.domain}. ${text}`;
    }
    case 'like': {
      return `Liked: ${event.title} on ${event.domain}. ${text}`;
    }
    default:
      return `Visited ${event.domain}: ${event.title}. ${text}`;
  }
}

/** Embed a single event by ID. Returns true if successful. */
export async function embedEvent(eventId: number): Promise<boolean> {
  const event = await db.browsing_events.get(eventId);
  if (!event) return false;
  if (event.embeddingId != null) return true; // already embedded

  const textToEmbed = buildEmbeddingText(event);

  if (!textToEmbed.trim()) return false;

  const response = await sendToOffscreen<EmbedTextResponse | EmbedTextError>({
    type: 'EMBED_TEXT',
    id: eventId,
    text: textToEmbed,
  });

  if (response.type === 'EMBED_TEXT_ERROR') {
    console.error(`[bg] Embedding failed for event ${eventId}:`, response.error);
    return false;
  }

  const vector = new Float32Array(response.vector);
  await addEmbedding(eventId, vector, MODEL_VERSION);
  console.log(`[bg] Embedded event ${eventId}`);
  return true;
}

/** Embed a session narrative. Creates or updates the embedding. */
export async function embedSessionNarrative(session: Session): Promise<boolean> {
  if (!session.id || !session.narrative.trim()) return false;

  const response = await sendToOffscreen<EmbedTextResponse | EmbedTextError>({
    type: 'EMBED_TEXT',
    id: session.id,
    text: session.narrative,
  });

  if (response.type === 'EMBED_TEXT_ERROR') {
    console.error(`[bg] Session embedding failed for ${session.id}:`, response.error);
    return false;
  }

  const vector = new Float32Array(response.vector);

  if (session.embeddingId != null) {
    // Update existing embedding in-place
    await updateEmbeddingVector(session.embeddingId, vector);
    console.log(`[bg] Updated session embedding ${session.id}`);
  } else {
    await addSessionEmbedding(session.id, vector, MODEL_VERSION);
    console.log(`[bg] Embedded session ${session.id}`);
  }

  return true;
}

/** Re-embed an event that already has an embedding (stale model version). */
async function reEmbedEvent(eventId: number): Promise<boolean> {
  const event = await db.browsing_events.get(eventId);
  if (!event) return false;

  const textToEmbed = buildEmbeddingText(event);
  if (!textToEmbed.trim()) return false;

  const response = await sendToOffscreen<EmbedTextResponse | EmbedTextError>({
    type: 'EMBED_TEXT',
    id: eventId,
    text: textToEmbed,
  });

  if (response.type === 'EMBED_TEXT_ERROR') {
    console.error(`[bg] Re-embedding failed for event ${eventId}:`, response.error);
    return false;
  }

  const vector = new Float32Array(response.vector);
  const existing = await getEmbeddingByEventId(eventId);
  if (existing?.id != null) {
    await updateEmbeddingVector(existing.id, vector);
    await db.embeddings.update(existing.id, { modelVersion: MODEL_VERSION });
  } else {
    await addEmbedding(eventId, vector, MODEL_VERSION);
  }

  console.log(`[bg] Re-embedded event ${eventId}`);
  return true;
}

/** Process all unembedded events, then re-embed stale ones. */
export async function processBacklog(): Promise<void> {
  const ids = await getUnembeddedEventIds();
  if (ids.length > 0) {
    console.log(`[bg] Processing ${ids.length} unembedded events`);
    for (const id of ids) {
      try {
        await embedEvent(id);
      } catch (err) {
        console.error(`[bg] Failed to embed event ${id}:`, err);
      }
    }
  }

  // Re-embed events with outdated model version
  const staleIds = await getStaleEmbeddingEventIds(MODEL_VERSION);
  if (staleIds.length > 0) {
    console.log(`[bg] Re-embedding ${staleIds.length} stale events`);
    for (const id of staleIds) {
      try {
        await reEmbedEvent(id);
      } catch (err) {
        console.error(`[bg] Failed to re-embed event ${id}:`, err);
      }
    }
  }
}

/** Process all unembedded sessions. */
export async function processSessionBacklog(): Promise<void> {
  const ids = await getUnembeddedSessionIds();
  if (ids.length === 0) return;

  console.log(`[bg] Processing ${ids.length} unembedded sessions`);

  for (const id of ids) {
    try {
      const session = await db.sessions.get(id);
      if (session) await embedSessionNarrative(session);
    } catch (err) {
      console.error(`[bg] Failed to embed session ${id}:`, err);
    }
  }
}
