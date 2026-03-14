import { db } from '@/storage/db';
import { addEmbedding, getUnembeddedEventIds } from '@/storage/embedding-store';
import { sendToOffscreen } from './offscreen-manager';
import type {
  EmbedTextResponse,
  EmbedTextError,
} from '@/shared/messages';

const MODEL_VERSION = 'all-MiniLM-L6-v2-q8';

/** Embed a single event by ID. Returns true if successful. */
export async function embedEvent(eventId: number): Promise<boolean> {
  const event = await db.browsing_events.get(eventId);
  if (!event) return false;
  if (event.embeddingId != null) return true; // already embedded

  const textToEmbed = [event.title, event.textContent]
    .filter(Boolean)
    .join('. ');

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

/** Process all unembedded events. */
export async function processBacklog(): Promise<void> {
  const ids = await getUnembeddedEventIds();
  if (ids.length === 0) return;

  console.log(`[bg] Processing ${ids.length} unembedded events`);

  for (const id of ids) {
    try {
      await embedEvent(id);
    } catch (err) {
      console.error(`[bg] Failed to embed event ${id}:`, err);
      // Continue with next event
    }
  }
}
